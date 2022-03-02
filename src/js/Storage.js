import Subscriptable from "js/Subscriptable.js";

import config from "config.json"

class Storage extends Subscriptable {

    /**
     * Construcs Storage object 
     * 
     * Calls {@link Storage#init} function
     */
    constructor() {
        super();

        this.onChromeStorageChange = this.onChromeStorageChange.bind(this);

        this.init();
    }

    /**
     * Checks version and adds Listener to chrome.storage
     * 
     * Method is called in {@link Storage#constructor}. Present only because constructors can't be async.
     * 
     * @private
     */
    async init() {
        let stored = await chrome.storage.local.get("storage_version");
        if (!("storage_version" in stored) || stored.storage_version !== config.storage_version) {
            await this.clear();
            await chrome.storage.local.set({ storage_version: config.storage_version });
        }
        chrome.storage.onChanged.addListener(this.onChromeStorageChange);
    }

    /**
     * Clears all storage
     */
    async clear() {
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
    }

    /**
     * Retrieves settings from storage
     * 
     * @returns {Promise<Object.<string,any>>} stored settings
     */
    async getSettings() {
        let stored = await chrome.storage.sync.get("settings");
        if (!("settings" in stored)) return {}
        return stored.settings;
    }

    /**
     * Stores setting
     * 
     * @param {Object.<string,any>} newSettings 
     */
    async saveSettings(newSettings) {
        await chrome.storage.sync.set({ settings: newSettings });
    }

    onChromeStorageChange(changes, area) {
        if (area === 'sync' && changes.settings?.newValue) {
            this.dispatch("settings.changed", changes.settings.newValue);
        }
    }

    /**
     * Stores request
     * 
     * @param {number} id 
     * @param {number} type
     */
    async saveRequest(id, type) {
        let stored = await chrome.storage.local.get("saved_state");
        let saved_state = ("saved_state" in stored) ? stored.saved_state : {};
        saved_state["request"] = { "id": id, "type": type };
        await chrome.storage.local.set({ "saved_state": saved_state });
    }

    /**
     * Stores additional info
     *  
     * @param {number} id 
     */
    async saveAdditionalInfo(id) {
        let stored = await chrome.storage.local.get("saved_state");
        let saved_state = ("saved_state" in stored) ? stored.saved_state : {};
        stored.saved_state["additional_inf"] = id;
        await chrome.storage.local.set({ "saved_state": saved_state });
    }

    /**
     * Clears stored request and additional info
     */
    async clearRequest() {
        await chrome.storage.local.remove("saved_state");
    }

    /**
     * Clears stored additional info
     */
    async clearAdditionalInfo() {
        let result = await chrome.storage.local.get("saved_state");
        if ("saved_state" in result)
            if ("additional_inf" in result.saved_state)
                await chrome.storage.local.set({ "saved_state": { "request": result.saved_state.request } })
    }

    /**
     * Retrieves saved state(request and additional info) from storage
     * 
     * @returns {Promise<{request:{id:number,type:number},additionalInfo?:number}>} saved state
     */
    async getSavedState() {
        let stored = await chrome.storage.local.get("saved_state");
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

    /**
     * Retrieves last update date from storage
     * 
     * @returns {Promise<string>}
     */
    async getLastUpdate() {
        let stored = await chrome.storage.local.get("last_update");
        return stored.last_update;
    }

    /**
     * Saves last update date
     * 
     * @param {string} update 
     */
    async saveLastUpdate(update) {
        await chrome.storage.local.set({ "last_update": update });
    }

    /**
     * Retrieves groups and preps from storage
     * 
     * @returns {Promise<{groups:Object.<number,string>,preps:Object.<number,{short:string,full:string}>}>} groups and preps 
     */
    async getGroupsPrepsLists() {
        let stored = await chrome.storage.local.get(["groupsPrepsLists"]);
        if (!stored.groupsPrepsLists) return null;
        return { groups: stored.groupsPrepsLists.groups, preps: stored.groupsPrepsLists.preps };
    }

    /**
     * Saves groups and preps
     * 
     * @param {Object.<number,string>} groups
     * @param {Object.<number,{short:string,full:string}>} preps
     */
    async saveGroupsPrepsLists(groups, preps) {
        await chrome.storage.local.set({ "groupsPrepsLists": { "groups": groups, "preps": preps } });
    }

}

export default new Storage;
