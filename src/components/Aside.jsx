import React from "react";

import { Switch, Slider } from "components/controls.jsx"
import SearchBlock from "components/SearchBlock.jsx"
import AdditionalInfo from "components/AdditionalInfo.jsx";
import AdditionalLessons from "components/AdditionalLessons.jsx";
import Preloader from "components/Preloader.jsx";

import SettingsContext from "components/SettingsContext.js";

import config from "config.json"

import "css/Aside.scss"

class Aside extends React.Component {

    state = {
        isAdditionalInfoShown: false,
        groupsList: [],
        prepsFullList: [],
        prepsShortList: []
    }
    static contextType = SettingsContext;

    constructor(props) {
        super(props);
        this.showAdditionalInfo = this.showAdditionalInfo.bind(this);
        this.getListsFromProps = this.getListsFromProps.bind(this);
        this.getCurrentDate = this.getCurrentDate.bind(this);
        this.weekChange = this.weekChange.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.onClickChangeButton = this.onClickChangeButton.bind(this);
        this.onClickMap = this.onClickMap.bind(this);

        this.state = {
            ...this.state,
            ...this.getListsFromProps()
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.info !== prevProps.info) {
            if (this.props.info) {
                this.setState(this.getListsFromProps());
            }
        }
    }

    showAdditionalInfo() {
        if (!this.state.isAdditionalInfoShown)
            this.setState({ isAdditionalInfoShown: true });
    }

    getListsFromProps() {
        if (!this.props.info) return {};
        return {
            groupsList: Object.entries(this.props.info.groups).map((ent) => { return { value: ent[0], label: ent[1] } }).sort((a, b) => { if (a.label > b.label) return 1; if (a.label < b.label) return -1; return 0 }),
            prepsFullList: Object.entries(this.props.info.preps).map((ent) => { return { value: ent[0], label: ent[1].full } }).sort((a, b) => { if (a.label > b.label) return 1; if (a.label < b.label) return -1; return 0 }),
            prepsShortList: Object.entries(this.props.info.preps).map((ent) => { return { value: ent[0], label: ent[1].short } }).sort((a, b) => { if (a.label > b.label) return 1; if (a.label < b.label) return -1; return 0 }),
        }
    }

    getCurrentDate() {
        let current_datetime = new Date();
        let week = config.day_names[current_datetime.getDay()];
        week = week.charAt(0).toLowerCase() + week.slice(1);
        let date = current_datetime.getDate();
        let month = config.month_names_in_genitive[current_datetime.getMonth()];
        let year = current_datetime.getFullYear();
        return (`${this.props.isWeekUp ? "▲" : "▼"} ${week}, ${date} ${month} ${year} года`)
    }

    weekChange(newValue) {
        this.props.onWeekChange(newValue);
    }

    onSearch(id, isGroup) {
        this.props.onSearch(id, isGroup);
        this.setState({ isAdditionalInfoShown: false })
    }

    onClickChangeButton(e) {
        this.setState((state, props) => {
            return { isAdditionalInfoShown: !state.isAdditionalInfoShown };
        })
    }

    onClickMap(id) {
        chrome.tabs.create({ url: config.url.sputnik_map + this.props.additionalInfo.rooms });
    }

    renderAdditionalBlock() {
        let additionalInfo = (!this.props.additionalInfo) ? null : {
            ...this.props.additionalInfo,
            build: this.props.additionalInfo.build[(this.context.list["short-builds"] ? "short" : "full")],
            groups: this.props.additionalInfo.groupsIds.map((groupId) => { return ({ id: groupId, name: this.props.info.groups[groupId] }); }),
            preps: this.props.additionalInfo.prepsIds.map((prepId) => {
                return ({
                    id: prepId,
                    name: this.props.info.preps[prepId][(this.context.list["full-prep"] ? "full" : "short")]
                });
            })
        };
        let additionalInfoElement = <AdditionalInfo onClick={this.onSearch} onClickMap={this.onClickMap} info={additionalInfo} />;
        if (this.props.additionalLessons.length == 0)
            return (additionalInfoElement)
        return (<React.Fragment >
            <button className="but but_additional" onClick={this.onClickChangeButton} disabled={this.props.isLoading || !this.props.isEnabled}> {this.state.isAdditionalInfoShown ? "Вне сетки расписания" : "Доп. информация"}</button >
            <Slider width={226} activeNumber={this.state.isAdditionalInfoShown}>
                <AdditionalLessons lessons={this.props.additionalLessons} />
                {additionalInfoElement}
            </Slider>
        </React.Fragment >)
    }

    render() {
        return (<aside>
            <div className={`date ${this.props.isWeekUp ? "up" : "down"}`}>{this.getCurrentDate()}</div>
            <Switch type="big" labels={["Нижняя", "Верхняя"]} value={this.props.isWeekUp} onChange={this.weekChange} />
            <SearchBlock onSubmit={this.onSearch}
                search={this.props.search}
                info={this.props.info}
                groupsList={this.state.groupsList}
                prepsList={this.context.list["full-prep"] ? this.state.prepsFullList : this.state.prepsShortList}
                isEnabled={!this.props.isLoading && this.props.isEnabled}
            />
            {this.renderAdditionalBlock()}
            {this.props.isLoading && <Preloader />}
            <span>Расписание получено с <a href={config.url.rasp_guap} target="_blank">rasp.guap</a></span>
        </aside >)
    }
}

export default Aside;
