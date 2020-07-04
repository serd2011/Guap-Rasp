"use strict";

class Error {

    static error;

    static showError(text, description, need_log) {
        if (this.error == undefined)
            this.error = $("<span>", { "class": "error" }).appendTo(document.body);
        this.error.text("Произошла ошибка: " + text);
        if (need_log) console.error("Произошла ошибка: " + text + "\n" + description);
    }
}

window.onerror = function (message, source, lineno, colno, error) {
    Error.showError("Неожиданное исключение", "", false);
};