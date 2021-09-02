import React from "react";

import config from "config.json"

import "css/AdditionalInfo.scss"

function importAll(r) {
    return [...new Set(r.keys().map((key) => { return r(key); }))];
}
const imgLessons = importAll(require.context('img/lessons/', true, /.svg/))

class AdditionalInfo extends React.PureComponent {

    state = { currentImg: null }

    generateRandomImageNumber() {
        let rnd;
        do {
            rnd = Math.floor(Math.random() * imgLessons.length)
        } while (rnd == this.state.currentImg)
        this.state.currentImg = rnd;
        return rnd;
    }

    renderPreps() {
        if (this.props.info.preps.length == 1 && this.props.info.preps[0].id == 0) return "Преподаватель не указан"
        return this.props.info.preps.map((prep) =>
            [<span key={prep.id} onClick={this.props.onClick.bind(null, prep.id, false)}>{prep.name}</span>, " "]
        )
    }

    render() {
        if (!("info" in this.props) || !this.props.info)
            return <div className="additional_inf empty"><div>Выберите занятие чтобы посмотреть дополнительную информацию</div></div>
        const info = this.props.info;
        return <div className="additional_inf">
            <div className="type">{info.type}</div>
            <div className={`week ${info.week == 1 ? "up" : "down"}`}>▼</div>
            <div className="img">
                <img src={imgLessons[info.id % imgLessons.length]} />
            </div>
            <div className="name">{info.name}</div>
            <div className="time">{`${config.day_short_names[info.day]} ${config.pairs_time[info.num]}`}</div>
            <div className="preps">
                {this.renderPreps()}
            </div>
            <div className="groups">
                {info.groups.map((group) =>
                    [<span key={group.id} onClick={this.props.onClick.bind(null, group.id, true)}>{group.name}</span>, " "]
                )}
            </div>
            <div className="where">
                {info.build}
                {" "}
                {config.build_names_for_map.includes(info.build) ? <span onClick={this.props.onClickMap}>{info.rooms}</span> : info.rooms}
            </div>
        </div>
    }
}

export default AdditionalInfo;
