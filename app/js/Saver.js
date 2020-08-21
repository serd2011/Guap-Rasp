Saver = {
    save: {

		/**
		 * Сохраняет запрос в хранилище
		 * @param {int} id id значения которое надо сохранить
		 * @param {int} type тип поля и значения Type
		 */
        request: async function (id, type) {
            let result = await chrome.storage.promise.local.get("saved_state");
            let saved_state = ("saved_state" in result) ? result.saved_state : {};
            saved_state["request"] = { "id": id, "type": type };
            chrome.storage.local.set({ "saved_state": saved_state });
        },

		/**
		 * Сохраняет дополнительную информацию в хранилище
		 * @param {int} id id значения которое надо сохранить
		 */
        additional_inf: async function (id) {
            let result = await chrome.storage.promise.local.get("saved_state");
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
            await chrome.storage.promise.local.remove("saved_state");
        },

		/**
		 * Удаляет дополнительную информацию из хранилища 
		 */
        additional_inf: async function () {
            let result = await chrome.storage.promise.local.get("saved_state");
            if ("saved_state" in result)
                if ("additional_inf" in result.saved_state)
                    await chrome.storage.promise.local.set({ "saved_state": { "request": result.saved_state.request } })
        }

    },

	/**
	 * Загружает информацию и вызывает соответствующие функции для дальнейшей обработки
	 * @callback put_request Функция обработки запроса
	 * @callback put_additional_inf Функция обработки дополнителной информации
	 */
    load: async function (put_request, put_additional_inf) {
        let result = await chrome.storage.promise.local.get("saved_state");
        if (!("saved_state" in result)) return;
        if (!("request" in result.saved_state)) return;
        await put_request(result.saved_state.request.id, result.saved_state.request.type);
        if ("additional_inf" in result.saved_state) put_additional_inf(result.saved_state.additional_inf);
    }
}