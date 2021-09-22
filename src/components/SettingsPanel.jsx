import React from "react";

import { Switch, Select } from "components/controls.jsx"

import SettingsContext from "components/SettingsContext.js";

import config from "config.json"

import "css/SettingsPanel.scss"

import imgSettingsButtons from "img/settingsButtons.svg"


class SettingsPanel extends React.Component {

    state = { isOpen: false }
    static contextType = SettingsContext;

    constructor(props) {
        super(props);
        this.onClickOpen = this.onClickOpen.bind(this);
        this.onClickClose = this.onClickClose.bind(this);
        this.onSettingChange = this.onSettingChange.bind(this);
        this.renderControl = this.renderControl.bind(this);
    }

    onClickOpen(e) {
        this.setState({ isOpen: true });
    }

    onClickClose(e) {
        this.setState({ isOpen: false });
    }

    onSettingChange(name, value) {
        this.context.changeSetting(name, value);
    }

    renderControl(setting) {
        let control;
        let Wrapper = "div";
        switch (setting.type) {
            case "select":
                control = <Select onChange={this.onSettingChange.bind(this, setting.name)} value={this.context.list[setting.name]} options={setting.options.map(({ name, title }) => ({ value: name, label: title }))} />
                break;
            case "checkbox":
                control = <Switch onChange={this.onSettingChange.bind(this, setting.name)} value={this.context.list[setting.name]} />
                Wrapper = "label";
                break;
        }
        return (<Wrapper className="setting" key={setting.name}>
            <span title={setting.description}>{setting.title}</span>
            {control}
        </Wrapper>)
    }

    render() {
        return <div className={`SettingsPanel ${this.state.isOpen ? "open" : ""}`}>
            <div className="background" onClick={this.onClickClose}></div>
            <div className="wrapper">
                <div className="button-open">
                    <svg onClick={this.onClickOpen}><use xlinkHref={imgSettingsButtons + "#openButton"} /></svg>
                </div>
                <div className="panel">
                    <div className="header">
                        <svg onClick={this.onClickClose}><use xlinkHref={imgSettingsButtons + "#closeButton"} /></svg>
                        <span>Настройки</span>
                    </div>
                    {config.settings.list.map(this.renderControl)}
                    < div className="inf-reload">
                        <button className="but background-change" title="Удаляет всю сохраненную информацию (настройки и списки групп и преподавателей)" onClick={this.props.onDeleteAll}>Удалить все данные</button>
                    </div>
                </div>
            </div>
        </div >
    }
}

export default SettingsPanel;
