/** Параметры настроек */
const settings_info = {
    "theme": {
        type: "sync",
        default: "light",
        apply: theme_apply
    },
    "save-request": {
        type: "local",
        default: true
    },
    "full-prep": {
        type: "sync",
        dafault: false,
        apply: full_prep_apply
    },
    "timetable-as-table": {
        type: "sync",
        default: true,
        apply: timetable_as_table_apply
    },
    "short-builds": {
        type: "sync",
        default: true,
    }
};

//==============
//	Настройки
//==============

/** Подготовка настроек*/
async function settings_prepair() {
    await load_settings();
    set_settings_controls();
    apply_settings();
}

/** Загружает настройки */
async function load_settings() {
    let sync = await chrome.storage.promise.sync.get("settings");
    let local = await chrome.storage.promise.local.get("settings");
    settings = { ...sync.settings, ...local.settings };
}

/** Сохраняет значения контролов настроек в хранилище */
function setting_changed() {
    let temp = { "local": {}, "sync": {} };
    $("#settings-block *[data-role='control']").each(function () {
        temp[settings_info[$(this).data("name")].type][$(this).data("name")] = get_control_value(this);
    });
    if (settings !== { ...temp.sync.settings, ...temp.local.settings }) {
        chrome.storage.sync.set({ "settings": temp.sync });
        chrome.storage.local.set({ "settings": temp.local });
    }
}

/** Устанавливание контролы настроек в правильные положения */
function set_settings_controls() {
    $("#settings-block *[data-role='control']").each(function () {
        if (!($(this).data("name") in settings)) settings[$(this).data("name")] = settings_info[$(this).data("name")].default;
        set_control_value(this, settings[$(this).data("name")]);
    });
}

/** Применяет измененные настройки */
function apply_settings() {
    for (setting in settings) {
        if (apply_settings.previous[setting] !== settings[setting])
            if (settings_info[setting].apply !== undefined)
                settings_info[setting].apply();
    }
    apply_settings.previous = settings;
}
apply_settings.previous = {};

/** Открывает настройки */
function settings_open() {
    $("body").addClass("settings-open");
}

/** Закрывает настройки */
function settings_close() {
    $("body").removeClass("settings-open");
}

chrome.storage.onChanged.addListener(function (changes) {
    if ("settings" in changes) {
        settings_prepair();
    }
});

/** Получает значение контрола правильным методом */
function get_control_value(control) {
    switch (control.nodeName) {
        case "INPUT":
            switch ($(control).attr('type')) {
                case "checkbox":
                    return control.checked;
                default:
                    return $(control).val();
            }
        default:
            return $(control).val();
    }
}

/** Устанавливает значение контролу правильным методом */
function set_control_value(control, value) {
    if (value == undefined) return;
    switch (control.nodeName) {
        case "INPUT":
            switch ($(control).attr('type')) {
                case "checkbox":
                    control.checked = value;
                    break;
                default:
                    $(control).val(value).trigger("value:changed");
                    break;
            }
            break;
        default:
            $(control).val(value).trigger("value:changed");
            break;
    }
}

//==============
//	Применение настроек
//==============

function theme_apply() {
    $(document.documentElement).attr("data-theme", settings.theme);
}

function full_prep_apply() {
    fill_prep();
}

function timetable_as_table_apply() {
    article.empty();
    if (settings["timetable-as-table"]) {
        article.addClass("table");
        article.append("<div class=\"day_name\">Понедельник</div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>" +
            "<div class=\"day_name\">Вторник</div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>" +
            "<div class=\"day_name\">Среда</div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>" +
            "<div class=\"day_name\">Четверг</div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>" +
            "<div class=\"day_name\">Пятница</div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>" +
            "<div class=\"day_name\">Суббота</div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>"
        );
        show_timetable.cells = $(">div:not(day_name)", article);
    } else {
        article.removeClass("table");
        article.append("<div class=\"column\"><div class=\"day_name\">Понедельник</div></div>" +
            "<div class=\"column\"><div class=\"day_name\">Вторник</div></div>" +
            "<div class=\"column\"><div class=\"day_name\">Среда</div></div>" +
            "<div class=\"column\"><div class=\"day_name\">Четверг</div></div>" +
            "<div class=\"column\"><div class=\"day_name\">Пятница</div></div>" +
            "<div class=\"column\"><div class=\"day_name\">Суббота</div></div>"
        );
        show_timetable.columns = $(">div", article).add(additional_lessons);
    }
    show_timetable();
}
