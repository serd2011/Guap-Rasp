"use strict";

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