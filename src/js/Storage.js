import chromeStoragePromise from "js/chrome-storage-promise.js";
import Subscriptable from "js/Subscriptable.js";

import config from "config.json"

class Storage extends Subscriptable {

    constructor() {
        super();
        this.init();
    }

    async init() {
        this.onChromeStorageChange = this.onChromeStorageChange.bind(this);

        let result = await chromeStoragePromise.local.get("storage_version");
        if (!("storage_version" in result) || result.storage_version !== config.storage_version) {
            await this.clear();
            await chromeStoragePromise.local.set({ storage_version: config.storage_version });
        }
        chrome.storage.onChanged.addListener(this.onChromeStorageChange);
    }

    async clear() {
        await chromeStoragePromise.local.clear();
        await chromeStoragePromise.sync.clear();
    }

    async getSettings() {
        let result = await chromeStoragePromise.sync.get("settings");
        if (!("settings" in result)) return {}
        return result.settings;
    }

    async saveSettings(newSettings) {
        await chromeStoragePromise.sync.set({ settings: newSettings });
    }

    onChromeStorageChange(changes, area) {
        if (area === 'sync' && changes.settings?.newValue) {
            this.dispatch("settings.changed", changes.settings.newValue);
        }
    }

    async saveRequest(id, type) {
        let result = await chromeStoragePromise.local.get("saved_state");
        let saved_state = ("saved_state" in result) ? result.saved_state : {};
        saved_state["request"] = { "id": id, "type": type };
        chrome.storage.local.set({ "saved_state": saved_state });
    }

    async saveAdditionalInfo(id) {
        let result = await chromeStoragePromise.local.get("saved_state");
        let saved_state = ("saved_state" in result) ? result.saved_state : {};
        result.saved_state["additional_inf"] = id;
        chrome.storage.local.set({ "saved_state": saved_state });
    }

    async clearRequest() {
        await chromeStoragePromise.local.remove("saved_state");
    }

    async clearAdditionalInfo() {
        let result = await chromeStoragePromise.local.get("saved_state");
        if ("saved_state" in result)
            if ("additional_inf" in result.saved_state)
                await chromeStoragePromise.local.set({ "saved_state": { "request": result.saved_state.request } })
    }

    async getSavedState() {
        let stored = await chromeStoragePromise.local.get("saved_state");
        if (!("saved_state" in stored)) return {};
        if (!("request" in stored.saved_state)) return {};
        let result = {
            request: {
                id: stored.saved_state.request.id,
                type: stored.saved_state.request.type
            }
        }
        if (stored.saved_state.additional_inf) result["additionalInfo"] = stored.saved_state.additional_inf;
        return result;
    }

}

export default new Storage;
