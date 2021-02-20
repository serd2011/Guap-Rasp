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
const pairs_time = ["", "1 пара (09:30-11:00)", "2 пара (11:10-12:40)", "3 пара (13:00-14:30)", "4 пара (15:00-16:30)", "5 пара (16:40-18:10)", "6 пара (18:30-20:00)", "7 пара (12:10-21:40)", "8 пара (21:50-23:20)"];
/** Картинки для информации о предмете */
const additional_inf_img = ["./img/lessons/1.png", "./img/lessons/2.png", "./img/lessons/3.png", "./img/lessons/4.png", "./img/lessons/5.png", "./img/lessons/6.png"];
/** Названия месяцев в родительном падеже */
const months_name_in_genitive = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
/** Сокращения дней недели */
const day_short_name = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
/** Сокращения названий корпусов */
const build_short_names = { "Гастелло 15": "Гаст.", "Б.Морская 67": "Б.М.", "Ленсовета 14": "Ленс.", "Московский 149в": "Моск." };
/** Названия корпусов для постоянной замены */
const build_names_for_always_change = { "Дистант": "Дистанционно" }

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
setTimeout(module_loaded, 300, "timeout");

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
	saver_prepair();
}

function page_prepair() {
	article = $("article");
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

	$(document).keydown(function (e) {
		if (e.keyCode != 27) return;
		empty_additional_info();
		if (additional_lessons.children().length != 0) open_additional_lessons();
	});

	$(".logo>img").click(function () { window.open("http://guap.ru", '_blank'); }); //Ссылка по клику
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
		initDateLabelAndSwitch(initial_data.IsWeekUp);
		let last_Update = await chrome.storage.promise.local.get("lastUpdate");
		//Проверяем дату последнего обновления
		if (last_Update.lastUpdate != initial_data.Update) {
			await get_info_from_api();
			await chrome.storage.promise.local.set({ "lastUpdate": initial_data.Update });
		} else await load_info();
		fill_datalists();
		//Загружаем предыдущий запрос при необходимости
		if (settings["save-request"]) await Saver.load(load_to_input_and_show_timetable, show_additional_info);
	} catch (e) {
		//Удаляем дату последнего обновления чтобы в следующий раз заново загрузить данные
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
	if (data.request) load_to_input_and_show_timetable(data.request.id, data.request.type);
}

/**
 * Выводит текущую дату и устанавливает переключатель недель в нужное положение
 * @param {boolean} is_week_up Является ли неделя верхней
 */
function initDateLabelAndSwitch(is_week_up) {
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
	fill_group();
	fill_prep();
}

function fill_group() {
	$("#groups").empty();
	for (let i in groups) {
		$("#groups").append($("<div>").text(groups[i]));
	}
	$("#groups").trigger("select:reload");
}


function fill_prep() {
	$("#preps").empty();
	for (let i in preps) {
		$("#preps").append($("<div>").text(get_prep_name(i)));
	}
	$("#preps").trigger("select:reload");
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

	// Чтобы предотваритить одновременную загрузку и показ нескольких одинаковых расписаний
	if (show_timetable.is_bisy) return;

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

	show_timetable.is_bisy = true;

	$(document).trigger("GuapRasp::timetableChanged", { id: id, type: type });

	let data;
	let preloader = new Preloader(article);
	inputs[Type.group].attr("disabled", true);
	inputs[Type.prep].attr("disabled", true);
	show_button.attr("disabled", true);

	try {
		data = await $.ajax({ url: url.timetable[type] + id });
	} catch (e) {
		show_timetable.is_bisy = false;
		preloader.close();
		show_button.attr("disabled", false);
		Notify.show("Не удается получить расписание");
		return;
	}

	//Очищаем блок дополнительных предметов
	additional_lessons.empty();
	additional_lessons.removeClass("empty");

	let is_need_extended = false;
	//Сортируем по номеру пары чтобы блоки создавались в правильном порядке
	if (!settings["timetable-as-table"])
		data.sort(function (a, b) {
			return Number(a.Less) - Number(b.Less);
		});

	for (let i in data) {
		timetable[data[i].ItemId] = data[i];
		if (data[i].Day == 0) {
			additional_lessons.append(
				$("<div>", { "data-lesson-id": data[i].ItemId }).append(
					$("<div>", { "class": "type" }).text(data[i].Type),
					$("<div>", { "class": "name" }).text(data[i].Disc),
					$("<div>", { "class": "classroom" }).text(data[i].Dept),
				)
			);
		} else {
			let lesson = $("<div>", { class: "lesson" }).append(
				$("<div>", { "class": "time" }).text(pairs_time[data[i].Less]),
				$("<div>", { "class": "type" }).text(data[i].Type),
				$("<div>", { "class": "name" }).text(data[i].Disc),
				$("<div>", { "class": "classroom" }).text(get_build(data[i].Build) + " " + (data[i].Rooms ? data[i].Rooms : "")),
			);
			if (settings["timetable-as-table"]) {
				show_timetable.cells.eq((data[i].Day - 1) * 9 + data[i].Less).append(
					$("<div>").addClass(data[i].Week == 1 ? "lesson_up" : "lesson_down")
						.append(lesson)
						.click(() => { show_additional_info(data[i].ItemId); })
				);
			} else {
				show_timetable.columns.eq(data[i].Day).append(
					lesson.addClass(data[i].Week == 1 ? "lesson_up" : "lesson_down")
						.click(() => { show_additional_info(data[i].ItemId); })
				);
			}
			if (data[i].Less > 6) is_need_extended = true;
		}
	}

	preloader.close();
	inputs[Type.group].attr("disabled", false);
	inputs[Type.prep].attr("disabled", false);
	show_button.attr("disabled", false);
	if (is_need_extended)
		article.addClass("extended");
	else
		article.removeClass("extended");
	if (additional_lessons.children().length == 0) {
		but_additional.hide();
		open_additional_inf();
	} else {
		but_additional.show();
		open_additional_lessons();
	}
	show_timetable.is_bisy = false;
}

/** Показывает дополнительную информацию по занятию 
 * @param {int} id id занятие информацию по которому нужно показать
*/
function show_additional_info(id) {
	open_additional_inf();

	let lesson = timetable[id];

	if (additional_inf.data("lesson-id") == lesson.ItemId) return;

	$(document).trigger("GuapRasp::additionalInfoChanged", { id: id });

	additional_inf.empty();
	additional_inf.removeClass("empty");
	additional_inf.data("lesson-id", lesson.ItemId);

	$("<div>").addClass("lesson_type").appendTo(additional_inf).text(lesson.Type);
	$("<div>").addClass("lesson_week").appendTo(additional_inf).text(lesson.Week == 1 ? "▲" : "▼").addClass(lesson.Week == 1 ? "up" : "down");
	$("<div>").addClass("lesson_img").appendTo(additional_inf).append(
		$("<img>", { "src": additional_inf_img[Math.floor(Math.random() * additional_inf_img.length)] })
	);
	$("<div>").addClass("lesson_name").appendTo(additional_inf).text(lesson.Disc);
	$("<div>").addClass("lesson_time").appendTo(additional_inf).text(day_short_name[lesson.Day] + " " + pairs_time[lesson.Less]);

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

	let where_wrapper = $("<div>").addClass("lesson_where").appendTo(additional_inf).text(get_build(lesson.Build) + " " + (lesson.Rooms ? lesson.Rooms : ""));
	if (lesson.Rooms && build_short_names[lesson.Build] == "Б.М.") {
		where_wrapper.text(get_build(lesson.Build) + " ");
		let where = lesson.Rooms.split(";");
		for (let i in where) {
			$("<span>", { "data-room": where[i] }).text(where[i]).appendTo(where_wrapper).click(where_BM_click).after(" ");
		}
	}

	function prep_click() {
		load_to_input_and_show_timetable($(this).data("prep"), Type.prep);
	}

	function group_click() {
		load_to_input_and_show_timetable($(this).data("group"), Type.group);
	}

	function where_BM_click() {
		chrome.tabs.create({ url: url.sputnik_map + $(this).data("room") });
	}
}

function day_change() {
	if (day_switch.checked) {
		article.removeClass("time_down");
		article.addClass("time_up");
	} else {
		article.removeClass("time_up");
		article.addClass("time_down");
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
	$(document).trigger("GuapRasp::additionalInfoCleared");
	additional_inf.addClass("empty");
	additional_inf.empty();
	additional_inf.append($("<div>").text("Выберите занятие чтобы посмотреть дополнительную информацию"));
}

/** Очищает блок дополнительных предметов */
function empty_additional_lessons() {
	additional_lessons.addClass("empty");
	additional_inf.removeData("lesson-id");
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
	if (settings["timetable-as-table"])
		$(">div:not(.day_name)", article).empty();
	else
		$(">.column > div:not(.day_name)", article).remove();
	empty_additional_lessons();
	empty_additional_info();
}

/** Полностью перезагружает все приложение */
function full_reload() {
	document.location.reload();
}

/**
 * Загружает значение с id в нужное поле и отображает расписания
 * @param {int} id id значения которое надо загрузить
 * @param {int} type тип поля и значения Type
 */
async function load_to_input_and_show_timetable(id, type) {
	clear_inputs();
	inputs[type].val(get_name(id, type));
	inputs[type].data("id", id);
	inputs[type].addClass("valid");
	show_button.attr("disabled", false);
	await show_timetable();

	function get_name(id, type) {
		return type == Type.group ? groups[id] : get_prep_name(id);
	}
}

function saver_prepair() {
	$(document).on("GuapRasp::timetableChanged", async (event, data) => { await Saver.clear.request(); Saver.save.request(data.id, data.type); })
		.on("GuapRasp::additionalInfoChanged", (event, data) => { Saver.save.additional_inf(data.id); })
		.on("GuapRasp::additionalInfoCleared", () => { Saver.clear.additional_inf(); });
}

/**
 * Вохвращает правильное название здания по его названию
 * @param {string} name название
 */
function get_build(name) {
	if (name == null) return "Не определено";
	name = name.trim();
	if (name in build_names_for_always_change) return build_names_for_always_change[name];
	return settings["short-builds"] ? build_short_names[name] || name : name;
}
