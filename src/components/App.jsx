import React from "react";
import { CSSTransition } from 'react-transition-group';

import Aside from "components/Aside.jsx"
import TimeTable from "components/TimeTable.jsx"
import SettingsPanel from "components/SettingsPanel.jsx"
import NoInternetMessage from "components/NoInternetMessage.jsx"

import SettingsContext from "components/SettingsContext.js";

import Storage from "js/Storage.js";
import * as helperFunctions from "js/helperFunctions.js";

import config from "config.json"

import "css/App.scss"
import "css/mainPreloader.css"

import imgLogo from "img/logo.svg"
import imgMainPreloader from "img/main-preloader.svg"

class App extends React.Component {

    state = {
        title: "Расписание занятий",
        isInternetAvailable: false,
        isReady: false,
        isLoadingInfo: true,
        isLoadingTimetable: false,
        isWeekUp: false,
        settings: {},
        initialInfo: {},
        data: {
            timetable: {},
            additionalLessons: [],
        },
        additionalInfoId: null,
        search: { id: null, isGroup: true }
    }

    constructor(props) {
        super(props);

        this.module_loaded = this.module_loaded.bind(this);
        this.keyPressed = this.keyPressed.bind(this);
        this.internetAvailabilityChanged = this.internetAvailabilityChanged.bind(this);
        this.initialDataLoaded = this.initialDataLoaded.bind(this);
        // Storage
        this.onDeleteAll = this.onDeleteAll.bind(this);
        // Settings
        this.settingsLoaded = this.settingsLoaded.bind(this);
        this.changeSetting = this.changeSetting.bind(this);
        // App events
        this.onWeekChange = this.onWeekChange.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.onLessonClick = this.onLessonClick.bind(this);

        this.gridRef = React.createRef();
        this.asideRef = React.createRef();

        //seting default state
        this.state.isInternetAvailable = window.navigator.onLine;
        this.state.settings = {
            changeSetting: this.changeSetting,
            list: Object.assign(config.settings.default)
        };
        this.state.initialInfo = {
            CurrentWeek: 0,
            IsAutumn: false,
            IsWeekOdd: false,
            IsWeekRed: false,
            IsWeekUp: false,
            Update: "1970-01-01T00:00:00",
            Years: ""
        };
        //data loading
        Storage.getSettings().then(this.settingsLoaded);
        if (this.state.isInternetAvailable) helperFunctions.requestInitialData().then(this.initialDataLoaded);
    }

    componentDidMount() {
        window.addEventListener('online', this.internetAvailabilityChanged);
        if (!this.state.isInternetAvailable) return;
        this.gridRef.current.parentElement.setAttribute("data-theme", config.settings.default.theme);
        Storage.subscribe("settings.changed", this.settingsLoaded);
        document.addEventListener("keydown", this.keyPressed);
        setTimeout(this.module_loaded, config.main_preloader_timeout, "timeout");
    }

    componentWillUnmount() {
        window.removeEventListener('online', this.internetAvailabilityChanged);
        if (!this.state.isInternetAvailable) return;
        Storage.unSubscribe("settings.changed", this.settingsLoaded);
        document.removeEventListener("keydown", this.keyPressed);
    }

    componentDidUpdate() {
        if (!this.state.isInternetAvailable) return;
        this.gridRef.current.parentElement.setAttribute("data-theme", this.state.settings.list.theme);
    }

    modules = { "settings": false, "timeout": false };
    module_loaded(name) {
        this.modules[name] = true;
        if (Object.values(this.modules).every(Boolean))
            this.setState({ isReady: true });
    }

    keyPressed(e) {
        if (e.keyCode != 27) return;
        Storage.clearAdditionalInfo();
        this.setState({ additionalInfoId: null });
    }

    internetAvailabilityChanged() {
        if (!this.state.isInternetAvailable && window.navigator.onLine)
            document.location.reload();
    }

    async initialDataLoaded(data) {
        let updateDate = new Date(data.initialInfo.Update);
        let newTitle = `Расписание занятий ${data.initialInfo.Years} учебного года от ${updateDate.getDate()} ${config.month_names_in_genitive[updateDate.getMonth()]}`;
        this.setState({
            isLoadingInfo: false,
            initialInfo: data.initialInfo,
            isWeekUp: data.initialInfo.IsWeekUp,
            info: {
                groups: data.groups,
                preps: data.preps
            },
            title: newTitle
        });
        //this.module_loaded("info");
        if (this.state.settings.list["save-request"]) {
            let stored = await Storage.getSavedState();
            if ("request" in stored) await this.onSearch(stored.request.id, (stored.request.type == 1));
            if ("additionalInfo" in stored) this.onLessonClick(stored.additionalInfo);
        }
    }

    // Storage
    async onDeleteAll() {
        await Storage.clear();
        document.location.reload();
    }

    // Settings

    settingsLoaded(data) {
        this.setState((state) => ({
            settings: {
                ...state.settings,
                list: {
                    ...state.settings.list,
                    ...data
                }
            }
        }));
        this.module_loaded("settings");
    }

    changeSetting(name, value) {
        let newList = {
            ...this.state.settings.list,
            [name]: value
        }
        this.setState((state) => ({
            settings: {
                ...state.settings,
                list: newList
            }
        }));
        Storage.saveSettings(newList);
    }

    // App events

    async onSearch(id, isGroup) {
        if (id == null) {
            this.setState({ search: { id: id, isGroup: isGroup }, data: { timetable: [], additionalLessons: [] } });
            Storage.clearRequest();
            return;
        }
        Storage.saveRequest(id, (isGroup ? 1 : 2));
        this.setState({ search: { id: id, isGroup: isGroup }, data: { timetable: [], additionalLessons: [] }, isLoadingTimetable: true });
        let { timetable, additionalLessons } = await helperFunctions.requestTimeTable(id, isGroup);
        this.setState({ data: { timetable: timetable, additionalLessons: additionalLessons }, additionalInfoId: null, isLoadingTimetable: false });
    }

    onWeekChange(newWeek) {
        this.setState({ isWeekUp: newWeek });
    }

    onLessonClick(id) {
        this.asideRef.current.showAdditionalInfo();
        if (this.state.additionalInfoId == id) return;
        Storage.saveAdditionalInfo(id);
        this.setState({ additionalInfoId: id });
    }

    // Render

    renderHeader() {
        return (<React.Fragment>
            <div className="header-background"></div>
            <div className="logo">
                <a href={config.url.guap_main} target="_blank" tabIndex="-1"><img src={imgLogo} /></a>
            </div>
            <div className="title">{this.state.title}</div>
        </React.Fragment>)
    }

    render() {
        if (!this.state.isInternetAvailable) return (<NoInternetMessage />);

        return (<SettingsContext.Provider value={this.state.settings}>
            <div className="grid" ref={this.gridRef}>
                {this.renderHeader()}
                <Aside ref={this.asideRef}
                    onWeekChange={this.onWeekChange}
                    onSearch={this.onSearch}
                    isLoading={this.state.isLoadingInfo}
                    isCurrentWeekUp={this.state.initialInfo.IsWeekUp}
                    isWeekUp={this.state.isWeekUp}
                    isEnabled={!this.state.isLoadingTimetable}
                    search={this.state.search}
                    info={this.state.info}
                    additionalLessons={this.state.data.additionalLessons}
                    additionalInfo={this.state.additionalInfoId && this.state.data.timetable[this.state.additionalInfoId]}
                />
                <TimeTable onLessonClick={this.onLessonClick}
                    info={this.state.data.timetable}
                    isWeekUp={this.state.isWeekUp}
                    isLoading={this.state.isLoadingTimetable}
                />
            </div>
            <SettingsPanel onDeleteAll={this.onDeleteAll} />
            <CSSTransition in={!this.state.isReady} timeout={400} unmountOnExit>
                <div id="main-preloader">
                    <img src={imgMainPreloader} />
                </div>
            </CSSTransition>
        </SettingsContext.Provider>)
    }
}

export default App;
