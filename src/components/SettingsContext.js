import React from "react"

import config from "config.json"

const SettingsContext = React.createContext(config.settings.default);

export default SettingsContext;
