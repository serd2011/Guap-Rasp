import React from "react";

import { Select } from "components/controls.jsx"

import "css/SearchBlock.scss"

class SearchBlock extends React.Component {

    onChangeSelect(isGroup, newId) {
        if (newId != null || this.props.search.isGroup == isGroup)
            this.props.onSubmit(newId, isGroup);
    }

    onClickButton(e) {
        this.props.onSubmit(this.props.search.id, this.props.search.isGroup);
    }

    render() {
        return <div className="SearchBlock">
            <div>
                <Select hasSearch showOptionsOnFocus placeholder="Группа"
                    value={this.props.search.isGroup ? this.props.search.id : null}
                    onChange={this.onChangeSelect.bind(this, true)}
                    options={this.props.groupsList}
                    disabled={!this.props.isEnabled}
                />
            </div>
            <div>
                <Select hasSearch showOptionsOnFocus placeholder="Преподаватель"
                    value={!this.props.search.isGroup ? this.props.search.id : null}
                    onChange={this.onChangeSelect.bind(this, false)}
                    options={this.props.prepsList}
                    disabled={!this.props.isEnabled}
                />
            </div>
            <div className="but_wrap">
                <button className="but background-change" onClick={this.onClickButton.bind(this)} disabled={(this.props.search.id === null) || !this.props.isEnabled}>Показать расписание</button>
            </div>
        </div>
    }
}

export default SearchBlock;
