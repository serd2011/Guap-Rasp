"use strict";

/**
 * Выводит сообщение
 */
class Notify {

    static notify;

    /**
     * Отображает переданное сообщение
     * 
     * @param {string} message Сообщение для отображения
     */
    static show(message) {
        if (this.notify == undefined)
            this.notify = $("<span>", { "class": "error" }).appendTo(document.body);
        this.notify.text("Произошла ошибка: " + message);
    }
}

/**
 * Обработчик ошибок
 */
class Exception extends Notify {

    /**
     * Отображает переданное сообщение и генерирует console.error
     * 
     * @param {string} message Сообщение для отображения
     * @param {string} description Дополнительная информация для console.error
     */
    static show(message, description) {
        super.show(message);
        console.error(message + "\n" + description);
    }
}

window.onerror = function (message, source, lineno, colno, error) {
    Exception.show("Неожиданное исключение", message + "\nФайл: " + source + " \nCтрока: " + lineno + "\nСтолбец: " + colno);
    return true;
};