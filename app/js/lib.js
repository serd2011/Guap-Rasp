"use strict";

window.onerror = function (message, source, lineno, colno, error) {
    Error.show("Неожиданное исключение", message + "\nФайл: " + source + " \nCтрока: " + lineno + "\nСтолбец: " + colno);
    return true;
};

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
class Error extends Notify {

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

/**
 * Работа с прелоадерами
 */
class Preloader {

    /**
     * Создает прелоадер в $wrapper блоке
     * 
     * @param {JQuery} $wrapper 
     */
    constructor($wrapper) {
        this.preloader = $("<div>", { "class": "preloader" }).appendTo($wrapper);

        if (Preloader.preloader_content == undefined)
            this.preloader.load('./img/preloader.svg', function (data) { Preloader.preloader_content = data; });
        else
            this.preloader.html(Preloader.preloader_content);
    }

    /**
     * Удаляет прелоадер
     */
    close() {
        this.preloader.animate({ opacity: 0 }, 200, function () { $(this).remove(); });
    }
}