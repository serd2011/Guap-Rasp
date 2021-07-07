import chromeStoragePromise from "js/chrome-storage-promise.js";

export default {
    save: {

        /**
         * Сохраняет запрос в хранилище
         * @param {int} id id значения которое надо сохранить
         * @param {int} type тип поля и значения Type
         */
        request: async function (id, type) {
            let result = await chromeStoragePromise.local.get("saved_state");
            let saved_state = ("saved_state" in result) ? result.saved_state : {};
            saved_state["request"] = { "id": id, "type": type };
            chrome.storage.local.set({ "saved_state": saved_state });
        },

        /**
         * Сохраняет дополнительную информацию в хранилище
         * @param {int} id id значения которое надо сохранить
         */
        additionalInfo: async function (id) {
            let result = await chromeStoragePromise.local.get("saved_state");
            let saved_state = ("saved_state" in result) ? result.saved_state : {};
            result.saved_state["additional_inf"] = id;
            chrome.storage.local.set({ "saved_state": saved_state });
        }
    },

    clear: {

        /**
        * Удаляет запрос из хранилища. Также влечет за собой удаление дополнительной информации
        */
        request: async function () {
            await chromeStoragePromise.local.remove("saved_state");
        },

        /**
         * Удаляет дополнительную информацию из хранилища 
         */
        additionalInfo: async function () {
            let result = await chromeStoragePromise.local.get("saved_state");
            if ("saved_state" in result)
                if ("additional_inf" in result.saved_state)
                    await chromeStoragePromise.local.set({ "saved_state": { "request": result.saved_state.request } })
        }

    },

    load: async function () {
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
