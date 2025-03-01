import React from "react";

import Preloader from "components/Preloader.jsx";

import SettingsContext from "components/SettingsContext.js";

import config from "config.json"

import "css/TimeTable.scss";

class TimeTable extends React.Component {

    static contextType = SettingsContext;

    constructor(props) {
        super(props);
        this.renderLesson = this.renderLesson.bind(this);
        this.renderDay = this.renderDay.bind(this);
        this.renderAsNotTable = this.renderAsNotTable.bind(this);
        this.renderAsTable = this.renderAsTable.bind(this);
    }

    renderLesson(lesson) {
        return (<div className="lesson" key={lesson.id} onClick={!this.context.list["timetable-as-table"] ? this.props.onLessonClick.bind(null, lesson.id) : undefined}>
            <div className="time">{`${lesson.num} пара (${lesson.time.begin.substring(0, 5)}-${lesson.time.end.substring(0, 5)})`}</div>
            <div className="type">{lesson.type}</div>
            <div className="name">{lesson.name}</div>
            <div className="classroom">{`${lesson.rooms}`}</div>
        </div>)
    }

    renderDay(day, index) {
        let lessons = [];
        for (let i = 0; i < day.length; i++) {
            if (day[i]) {
                lessons[i] = <div key={"lesson" + i} onClick={this.props.onLessonClick.bind(null, day[i].id)}>
                    {this.renderLesson(day[i])}
                </div>
            } else {
                lessons[i] = <div key={"lesson" + i} className="empty" />
            }
        }
        return (<React.Fragment key={index}>
            <div className="day_name" key={"day" + index}>{config.day_names[index + 1]}</div>
            {lessons}
        </React.Fragment>)
    }

    renderAsNotTable(timetable) {
        return (<React.Fragment>
            {timetable.map((day, index) => {
                return (<div className="column" key={"column" + index}>
                    <div className="day_name">{config.day_names[index + 1]}</div>
                    {day.map((lesson) => { return (this.renderLesson(lesson)); })}
                </div>)
            })}
        </React.Fragment>)
    }

    renderAsTable(timetable) {
        return (<React.Fragment>
            {timetable.map(this.renderDay)}
        </React.Fragment >)
    }

    render() {
        let timetable = [[], [], [], [], [], [],];
        let needExtended = false;
        for (let lessonId in this.props.info) {
            let lesson = this.props.info[lessonId];
            if (lesson.num > 6) needExtended = true;
            if ((lesson.week != 0) && (lesson.week % 2 != this.props.isWeekUp)) continue;
            timetable[lesson.day - 1][lesson.num - 1] = lesson;
        }
        for (let day in timetable) {
            timetable[day].length = (needExtended ? 8 : 6);
        }
        let DayWrapper = this.context.list["timetable-as-table"] ? "Fragment" : "div";
        return (<article className={`${this.context.list["timetable-as-table"] ? "table" : ""} ${needExtended ? "extended" : ""}`}>
            {this.context.list["timetable-as-table"] ? this.renderAsTable(timetable) : this.renderAsNotTable(timetable)}
            {this.props.isLoading && <Preloader />}
        </article>)
    }
}

export default TimeTable;
