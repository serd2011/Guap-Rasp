import React from "react";

import "css/AdditionalLessons.scss"

class AdditionalLessons extends React.Component {

    render() {
        return (<div className="additional_lessons">
            {this.props.lessons.map((lesson) => {
                return (<div key={lesson.id}>
                    <div className="type">{lesson.type}</div>
                    <div className="name">{lesson.name}</div>
                    <div className="classroom">{lesson.dept}</div>
                </div>);
            })}
        </div>
        )
    }

}

export default AdditionalLessons;
