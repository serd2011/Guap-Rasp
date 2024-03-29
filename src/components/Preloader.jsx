import React from "react";

import "css/Preloader.scss";

class Preloader extends React.PureComponent {
    render() {
        return (<div className="preloader">
            <svg xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">
                <path d="M10 50A40 40 0 0 0 90 50A40 44 0 0 1 10 50" stroke="none"></path>
            </svg>
        </div>)
    }
}

export default Preloader;

