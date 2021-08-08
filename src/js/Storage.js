import chromeStoragePromise from "js/chrome-storage-promise.js";
import Subscriptable from "js/Subscriptable.js";

import config from "config.json"

class Storage extends Subscriptable {

    constructor() {
        super();

        this.onChromeStorageChange = this.onChromeStorageChange.bind(this);

        this.init();
    }

    async init() {
        let stored = await chromeStoragePromise.local.get("storage_version");
        if (!("storage_version" in stored) || stored.storage_version !== config.storage_version) {
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
        let stored = await chromeStoragePromise.sync.get("settings");
        if (!("settings" in stored)) return {}
        return stored.settings;
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
        let stored = await chromeStoragePromise.local.get("saved_state");
        let saved_state = ("saved_state" in stored) ? stored.saved_state : {};
        saved_state["request"] = { "id": id, "type": type };
        await chromeStoragePromise.local.set({ "saved_state": saved_state });
    }

    async saveAdditionalInfo(id) {
        let stored = await chromeStoragePromise.local.get("saved_state");
        let saved_state = ("saved_state" in stored) ? stored.saved_state : {};
        stored.saved_state["additional_inf"] = id;
        await chromeStoragePromise.local.set({ "saved_state": saved_state });
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

    async getLastUpdate() {
        let stored = await chromeStoragePromise.local.get("last_update");
        return stored.last_update;
    }

    async saveLastUpdate(update) {
        await chromeStoragePromise.local.set({ "last_update": update });
    }

    async getGroupsPrepsLists() {
        let stored = await chromeStoragePromise.local.get(["groupsPrepsLists"]);
        if (!stored.groupsPrepsLists) return null;
        return { groups: stored.groupsPrepsLists.groups, preps: stored.groupsPrepsLists.preps };
    }

    async saveGroupsPrepsLists(groups, preps) {
        await chromeStoragePromise.local.set({ "groupsPrepsLists": { "groups": groups, "preps": preps } });
    }

}

export default new Storage;
