"use strict";

let article;
let day_switch;
let additional_inf;
let additional_lessons;
let but_additional;
let inputs;
let show_button;

/** Текущие настройки */
let settings = {};
/** Список групп | id => группа */
let groups = {};
/** Список преподавателей | id => {short => только имя, full => имя вместе с должностью} */
let preps = {};
/** Расписание | id => занятие */
let timetable = {};

/** Название и время пар */
const pairs_time = ["", "1 пара (09:00-10:30)", "2 пара (10:40-12:10)", "3 пара (12:20-13:50)", "4 пара (14:10-15:40)", "5 пара (15:50-17:20)", "6 пара (17:30-19:00)", "7 пара (19:10-20:30)", "8 пара (20:40-22:00)"];
/** Картинки для информации о предмете */
const additional_inf_img = ["./img/lessons/1.png", "./img/lessons/2.png", "./img/lessons/3.png", "./img/lessons/4.png", "./img/lessons/5.png", "./img/lessons/6.png"];
/** Названия месяцев в родительном падеже */
const months_name_in_genitive = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const Type = {
	"group": 1,
	"prep": 2
}
/** Массив выжных Url'ов */
const url = {
	"info": {
		"initial": "https://api.guap.ru/rasp/custom/get-sem-info",
		"groups": "https://api.guap.ru/rasp/custom/get-sem-groups",
		"preps": "https://api.guap.ru/rasp/custom/get-sem-preps",
	},
	"sputnik_map": "http://sputnik.guap.ru/nav/?src=%D0%B2%D1%85%D0%BE%D0%B4&dst=",
	"timetable": {
		[Type.group]: "https://api.guap.ru/rasp/custom/get-sem-rasp/group",
		[Type.prep]: "https://api.guap.ru/rasp/custom/get-sem-rasp/prep",
	},
}

$(document).ready(ready);
setTimeout(module_loaded, 500, "timeout");

/**
 * Сообщает о загруженном модуле
 * @param {string} name 
 */
function module_loaded(name) {
	module_loaded.modules[name] = true;

	if (is_all_true(module_loaded.modules)) {
		$("#main-preloader").animate({ opacity: 0 }, 400, function () { $(this).remove(); });
	}

	function is_all_true(obj) {
		for (var o in obj)
			if (!obj[o]) return false;
		return true;
	}
}
module_loaded.modules = { "settings": false, "timeout": false };

async function ready() {
	page_prepair();
	await settings_prepair();
	module_loaded("settings");
	info_prepair();
}

function page_prepair() {
	article = document.getElementsByTagName("article")[0];
	day_switch = document.getElementById("checkbox");
	but_additional = $(".but_additional");
	additional_inf = $(".additional_inf");
	additional_lessons = $(".additional_lessons");
	show_button = $("#timetable-show-but");


	day_switch.addEventListener("change", day_change, true);

	but_additional.click(additional_but_click);

	$("#settings-button-open").click(settings_open);
	$("#settings-button-close").click(settings_close);
	$("#settings-background").click(settings_close);
	$("#inf-reload").click(async function () { await chrome.storage.promise.local.clear(); await chrome.storage.promise.sync.clear(); full_reload(); });

	$("#settings-block *[data-role='control']").each(function () {
		$(this).change(setting_changed);
	});

	inputs = {
		[Type.group]: $("#groups_input"),
		[Type.prep]: $("#preps_input")
	}

	inputs[Type.group].change(input_change);
	inputs[Type.prep].change(input_change);

	function input_change() {
		let changed_type = $(this)[0] == inputs[Type.group][0] ? Type.group : Type.prep;
		let another_type = $(this)[0] == inputs[Type.group][0] ? Type.prep : Type.group;
		inputs[another_type].val("").removeClass("valid").removeData("id");
		show_button.attr("disabled", false);
		inputs[changed_type].val(inputs[changed_type].val().trim());
		let id = find_by_name(inputs[changed_type].val(), changed_type);
		if (id != -1) {
			inputs[changed_type].addClass("valid");
			inputs[changed_type].data("id", id);
		} else {
			inputs[changed_type].val("");
			inputs[changed_type].removeClass("valid");
			inputs[changed_type].removeData("id");
			show_button.attr("disabled", true);
		}
		show_timetable();
	}

	function additional_but_click() {
		if (additional_inf.hasClass("display_none"))
			open_additional_inf();
		else
			open_additional_lessons();
	}

	$("#timetable-show-but").click(show_timetable);
	empty_additional_info();
	empty_additional_lessons();

	$(".logo>img").click(function(){window.open("http://guap.ru", '_blank');}); //Ссылка по клику
}

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
		temp[$(this).data("type")][$(this).data("name")] = get_control_value(this);
	});
	chrome.storage.sync.set({ "settings": temp.sync });
	chrome.storage.local.set({ "settings": temp.local });
}

/** Устанавливание контролы настроек в правильные положения */
function set_settings_controls() {
	$("#settings-block *[data-role='control']").each(function () {
		set_control_value(this, settings[$(this).data("name")]);
	});
}

/** Применяет настройки */
function apply_settings() {
	switch (settings.theme) {
		case "light":
			$("body").removeClass("dark");
			break;
		case "dark":
			$("body").addClass("dark");
			break;
	}
	fill_datalists();
}

/** Открывает настройки */
function settings_open() {
	$("#settings-block").addClass("open");
	$("#settings-background").addClass("shown");
}

/** Закрывает настройки */
function settings_close() {
	$("#settings-block").removeClass("open");
	$("#settings-background").removeClass("shown");
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
			}
			return $(control).val();
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
			}
			$(control).val(value);
			break;
		default:
			$(control).val(value);
			break;
	}
}

//==============
//	  Инфа
//==============

/** Загружает и обрабатывает начальную информацию, а также информацию о группах и преподавателях */
async function info_prepair() {
	let preloader = new Preloader($("aside"));
	try {
		//Получаем начальные данные
		let initial_data = await $.ajax({ url: url.info.initial });
		update_title(initial_data.Update, initial_data.Years);
		changeDate(initial_data.IsWeekUp);
		let last_Update = await chrome.storage.promise.local.get("lastUpdate");
		//Проверяем дату последнего обновления
		if (last_Update.lastUpdate != initial_data.Update) {
			await get_info_from_api();
			await chrome.storage.promise.local.set({ "lastUpdate": initial_data.Update });
		} else await load_info();
		fill_datalists();
		//Загружаем предыдущий запрос при необходимости
		if (settings["save-request"]) await load_saved_request();
	} catch (e) {
		//Удаляем дату последнего обновления чтобы в следующий раз заного загрузить данные
		chrome.storage.local.set({ "lastUpdate": "" });
		Exception.show("Произошла ошибка при обновлении данных", e.toString());
		return;
	}
	preloader.close();
}

/** Загружает информацию о группах и преподавателях через API и сохраняет ее в хранилище */
async function get_info_from_api() {
	//Получаем список групп
	let groups_data = await $.ajax({ url: url.info.groups });
	//Превращаем в список id => группа
	groups = {};
	for (let i in groups_data) {
		groups[groups_data[i].ItemId] = groups_data[i].Name;
	}
	//Получаем список преподавателей
	let preps_data = await $.ajax({ url: url.info.preps });
	//Превращаем в список id => {short => только имя, full => имя вместе с должностью}
	preps = {};
	for (let i in preps_data) {
		preps[preps_data[i].ItemId] = {
			short: preps_data[i].Name.substring(0, preps_data[i].Name.indexOf("—") - 1),
			full: preps_data[i].Name
		};
	}
	//Сохраняем
	await chrome.storage.promise.local.set({ "preps": preps, "groups": groups });
}

/** Загружает информацию о группах и преподавателях из хранилища */
async function load_info() {
	let data = await chrome.storage.promise.local.get(["groups", "preps"]);
	groups = data.groups;
	preps = data.preps;
}

/** Загружает и устанавливает предыдущий запрос */
async function load_saved_request() {
	let data = await chrome.storage.promise.local.get("request");
	if (data.request) load_value_to_input(data.request.id, data.request.type);
}

/**
 * Выводит текущую дату и устанавливает переключатель недель в нужное положение
 * @param {boolean} is_week_up Является ли неделя верхней
 */
function changeDate(is_week_up) {
	const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
	var current_datetime = new Date();
	var week = days[current_datetime.getDay()];
	var date = current_datetime.getDate();
	var month = months_name_in_genitive[current_datetime.getMonth()];
	var year = current_datetime.getFullYear();
	if (is_week_up) {
		$(".date").addClass("up");
		$("#checkbox").prop('checked', true);
		$('.date').text("▲ " + week + ", " + date + " " + month + " " + year + " года");
	} else {
		$(".date").addClass("down");
		$("#checkbox").prop('checked', false);
		$('.date').text("▼ " + week + ", " + date + " " + month + " " + year + " года");
	}
	day_change();
}

/** Очищает и заполняет datalist'ы */
function fill_datalists() {
	$("#groups").empty();
	$("#preps").empty();
	for (let i in groups) {
		$("#groups").append($("<option>").text(groups[i]));
	}
	for (let i in preps) {
		$("#preps").append($("<option>").text(get_prep_name(i)));
	}
}

/**
 * Обновляет заголовок страницы в соответствии с переданными данными
 * @param {string} update Дата последнего обновления в строковом формате
 * @param {string} years Год из начальной инфы
 */
function update_title(update, years) {
	let date = new Date(update);
	$(".title").text("Расписание занятий " + years + " учебного года от " + date.getDate() + " " + months_name_in_genitive[date.getMonth()]);
}

/**
 * Возвращает имя преподавателя в соответствии с настройкой
 * @param {int} id id преподавателя
 */
function get_prep_name(id) {
	return settings["full-prep"] ? preps[id].full : preps[id].short;
}

/**
 * Выполняет поиск группы по ее имени. В случае успеха возвращает ее id, в противном случае возвращает -1
 * @param {string} name Имя группы
 */
function find_group_by_name(name) {
	for (let i in groups)
		if (groups[i] == name)
			return i;
	return -1;
}

/**
 * Выполняет поиск преподавателя по его имени. В случае успеха возвращает его id, в противном случае возвращает -1
 * @param {string} name Имя преподавателя
 */
function find_prep_by_name(name) {
	for (let i in preps)
		if (get_prep_name(i) == name)
			return i;
	return -1;
}
/**
 * 
 * @param {string} name Имя
 * @param {*} type Тип
 */
function find_by_name(name, type) {
	return type == Type.group ? find_group_by_name(name) : find_prep_by_name(name);
}

//==============
//  Расписание
//==============

/** Получает и выводит расписание */
async function show_timetable() {
	clear_timetable();

	let id;
	let type;

	if (id = inputs[Type.group].data("id"))
		type = Type.group;
	else if (id = inputs[Type.prep].data("id"))
		type = Type.prep;
	else {
		clear_inputs();
		return;
	};

	let data;
	let preloader = new Preloader($("article"));
	show_button.attr("disabled", true);
	save_request_to_storage(id, type);

	try {
		data = await $.ajax({ url: url.timetable[type] + id });
	} catch (e) {
		preloader.close();
		show_button.attr("disabled", false);
		Notify.show("Не удается получить расписание");
		return;
	}

	//Очищаем блок дополнительных предметов
	additional_lessons.empty();
	additional_lessons.removeClass("empty");
	//Сортируем по номеру пары чтобы блоки создавались в правильном порядке
	data.sort(function (a, b) {
		return parseFloat(a.Less) - parseFloat(b.Less);
	});

	for (let i in data) {
		timetable[data[i].ItemId] = data[i];
		if (data[i].Day == 0) {
			additional_lessons.append(
				$("<div>", { "data-lesson": data[i].ItemId }).append(
					$("<div>", { "class": "type" }).text(data[i].Type),
					$("<div>", { "class": "lesson" }).text(data[i].Disc),
					$("<div>", { "class": "classroom" }).text(data[i].Dept),
				)
			);
		} else {
			$(".column[data-day='" + data[i].Day + "']").append(
				$("<div>", { "data-lesson": data[i].ItemId, "class": data[i].Week == 1 ? "lesson_up" : "lesson_down" }).append(
					$("<div>", { "class": "time" }).text(pairs_time[data[i].Less]),
					$("<div>", { "class": "type" }).text(data[i].Type),
					$("<div>", { "class": "lesson" }).text(data[i].Disc),
					$("<div>", { "class": "classroom" }).text(data[i].Build + " " + data[i].Rooms),
				).click(show_additional_info)
			);
		}
	}

	preloader.close();
	show_button.attr("disabled", false);
	if (additional_lessons.children().length == 0) {
		but_additional.hide();
		open_additional_inf();
	} else {
		but_additional.show();
		open_additional_lessons();
	}
}

/** Показывает дополнительную информацию по занятию */
function show_additional_info() {

	open_additional_inf();

	let lesson = timetable[$(this).data("lesson")];

	if (additional_inf.data("lesson") == lesson.ItemId) return;

	additional_inf.empty();
	additional_inf.removeClass("empty");
	additional_inf.data("lesson", lesson.ItemId);

	$("<div>").addClass("lesson_type").appendTo(additional_inf).text(lesson.Type);
	$("<div>").addClass("lesson_week").appendTo(additional_inf).text(lesson.Week == 1 ? "▲" : "▼").addClass(lesson.Week == 1 ? "up" : "down");
	$("<div>").addClass("lesson_img").appendTo(additional_inf).append(
		$("<img>", { "src": additional_inf_img[Math.floor(Math.random() * additional_inf_img.length)] })
	);
	$("<div>").addClass("lesson_name").appendTo(additional_inf).text(lesson.Disc);
	$("<div>").addClass("lesson_time").appendTo(additional_inf).text(pairs_time[lesson.Less]);

	let preps_wrapper = $("<div>").addClass("lesson_preps").appendTo(additional_inf);
	if (lesson.Preps) {
		let preps_id = lesson.Preps.slice(1, -1).split("::");
		for (let i in preps_id) {
			$("<span>", { "data-prep": preps_id[i] }).text(get_prep_name(preps_id[i])).appendTo(preps_wrapper).click(prep_click);
		}
	} else {
		preps_wrapper.text("Преподаватель не указан");
	}

	let groups_wrapper = $("<div>").addClass("lesson_groups").appendTo(additional_inf);
	if (lesson.Groups) {
		let groups_id = lesson.Groups.slice(1, -1).split("::");
		for (let i in groups_id) {
			$("<span>", { "data-group": groups_id[i] }).text(groups[groups_id[i]]).appendTo(groups_wrapper).click(group_click).after(" ");
		}
	} else {
		groups_wrapper.text("Группа не указана");
	}

	let where_wrapper = $("<div>").addClass("lesson_where").appendTo(additional_inf).text(lesson.Build + " " + lesson.Rooms);
	if (lesson.Rooms && lesson.Build == "Б.М.") {
		where_wrapper.text("Б.М. ");
		let where = lesson.Rooms.split(";");
		for (let i in where) {
			$("<span>", { "data-room": where[i] }).text(where[i]).appendTo(where_wrapper).click(where_BM_click).after(" ");
		}
	}

	function prep_click() {
		load_value_to_input($(this).data("prep"), Type.prep);
	}

	function group_click() {
		load_value_to_input($(this).data("group"), Type.group);
	}

	function where_BM_click() {
		chrome.tabs.create({ url: url.sputnik_map + $(this).data("room") });
	}
}

function day_change() {
	if (day_switch.checked) {
		article.classList.remove("time_down");
		article.classList.add("time_up");
	} else {
		article.classList.remove("time_up");
		article.classList.add("time_down");
	}
}

/** Открывает блок дополнительной информаци */
function open_additional_inf() {
	additional_inf.removeClass("display_none");
	additional_lessons.addClass("display_none");
	but_additional.text("Вне сетки расписания");
}

/** Открывает блок дополнительных предметов */
function open_additional_lessons() {
	additional_inf.addClass("display_none");
	additional_lessons.removeClass("display_none");
	but_additional.text("Доп. информация");
}

//==============
//	 Очистки
//==============

/** Очищает блок дополнительной информации */
function empty_additional_info() {
	additional_inf.addClass("empty");
	additional_inf.empty();
	additional_inf.append($("<div>").text("Выберите занятие чтобы посмотреть дополнительную информацию"));
}

/** Очищает блок дополнительных предметов */
function empty_additional_lessons() {
	additional_lessons.addClass("empty");
	additional_inf.removeData("lesson");
	additional_lessons.empty();
	additional_lessons.text("Загрузите расписание чтобы посмотреть дополнительные занятия");
}

/** Очищает поля группы и преподавателя */
function clear_inputs() {
	inputs[Type.group].val("");
	inputs[Type.prep].val("");
	inputs[Type.group].removeData("id");
	inputs[Type.prep].removeData("id");
	inputs[Type.group].removeClass("valid");
	inputs[Type.prep].removeClass("valid");
	show_button.attr("disabled", true);
}

/** Очищает расписание */
function clear_timetable() {
	timetable = {};
	$(".column > div:not(.day_name)").remove();
	empty_additional_lessons();
	empty_additional_info();
}

/** Полностью перезагружает все приложение */
function full_reload() {
	document.location.reload();
}

/**
 * Загружает значение с id в нужное поле
 * @param {int} id id значения которое надо загрузить
 * @param {int} type тип поля и значения Type
 */
function load_value_to_input(id, type) {
	clear_inputs();
	inputs[type].val(get_name(id, type));
	inputs[type].data("id", id);
	inputs[type].addClass("valid");
	show_button.attr("disabled", false);
	show_timetable();

	function get_name(id, type) {
		return type == Type.group ? groups[id] : get_prep_name(id);
	}
}

/**
 * Сохраняет запрос в хранилище
 * @param {int} id id значения которое надо загрузить
 * @param {int} type тип поля и значения Type
 */
function save_request_to_storage(id, type) {
	chrome.storage.local.set({ "request": { "id": id, "type": type } });
}
