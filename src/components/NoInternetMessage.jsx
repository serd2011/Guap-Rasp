import React from "react"

import "css/NoInternetMessage.scss"

export default class NoInternetMessage extends React.Component {
    render() {
        return (<div className="NoInternetMessage">
            <div className="message">
                <h1>Не удается обнаружить подключение к интернету</h1>
                <h3>К сожалению, работа расширения не возможна без доступа к интернету</h3>
            </div>
        </div>)
    }
}
