"use strict";

$(document).ready(ready);

let article;
let day_switch;
let additional_inf;
let additional_lessons;
let groups_input;
let preps_input;
let show_button;

/** Текущие настройки */
let settings = {};

/** Список групп | группа => id */
let groups = {};
/** Список преподавателей | имя => id */
let preps = {};
/** Расписание | id => занятие */
let timetable = {};

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

function ready() {
	page_prepair();
	settings_prepair();
	info_prepair();
}

function page_prepair() {
	article = document.getElementsByTagName("article")[0];
	day_switch = document.getElementById("checkbox");
	let additional_lessons_but = document.getElementsByClassName("but_additional_lessons")[0];
	additional_inf = document.getElementsByClassName("additional_inf")[0];
	additional_lessons = $(".additional_lessons");
	show_button = $("#timetable-show-but");


	day_switch.addEventListener("change", day_change, true);

	additional_lessons_but.addEventListener("click", additional_lessons_but_click, true);

	$("#settings-button-open").click(settings_open);
	$("#settings-button-close").click(settings_close);
	$("#settings-background").click(settings_close);

	$("#settings-block *[data-role='control']").each(function () {
		$(this).change(setting_changed);
	});

	groups_input = $("#groups_input");
	preps_input = $("#preps_input");

	groups_input.change(check_input_value);
	preps_input.change(check_input_value);
	groups_input.on('keypress', function (e) {
		if (e.which === 13) show_timetable();
	});
	preps_input.on('keypress', function (e) {
		if (e.which === 13) show_timetable();
	});

	function check_input_value() {
		preps_input.attr("disabled", false);
		groups_input.attr("disabled", false);
		if (groups_input.val() != "") {
			preps_input.attr("disabled", true);
		} else if (preps_input.val() != "")
			groups_input.attr("disabled", true);

		show_button.attr("disabled", true);
		if (groups_input.val() in groups)
			show_button.attr("disabled", false);
		if (preps_input.val() in preps)
			show_button.attr("disabled", false);
	}

	$("#timetable-show-but").click(show_timetable);
}

function settings_prepair() {

	let temp = { "local": [], "sync": [] };

	$("#settings-block *[data-role='control']").each(function () {
		temp[$(this).data("type")].push($(this).data("name"));
	});

	//Пока только синк
	if (temp.sync.length)
		chrome.storage.sync.get(temp.sync, use_settings);

	function use_settings(data) {
		settings = data;
		set_settings_controls();
		apply_settings();
		module_loaded("settings");
	}

	function set_settings_controls() {
		$("#settings-block *[data-role='control']").each(function () {
			set_control_value(this, settings[$(this).data("name")]);
		});
		$("#settings-block > .preloader").remove();
	}

}

function apply_settings() {
	switch (settings.theme) {
		case "light":
			$("body").removeClass("dark");
			break;
		case "dark":
			$("body").addClass("dark");
			break;
	}
}

function day_change() {
	if (day_switch.checked) {
		article.classList.remove("time_dn");
		article.classList.add("time_em");
	} else {
		article.classList.remove("time_em");
		article.classList.add("time_dn");
	}
}

function additional_lessons_but_click() {
	if (additional_inf.classList.contains("display_none")) {
		additional_inf.classList.remove("display_none");
		additional_lessons.addClass("display_none");
	} else {
		additional_inf.classList.add("display_none");
		additional_lessons.removeClass("display_none");
	}
}

function settings_open() {
	$("#settings-block").addClass("open");
	$("#settings-background").addClass("shown");
}

function settings_close() {
	$("#settings-block").removeClass("open");
	$("#settings-background").removeClass("shown");
}

function setting_changed() {
	if ($(this).data("type") == "sync")
		chrome.storage.sync.set({ [$(this).data("name")]: get_control_value(this) });
}

chrome.storage.onChanged.addListener(function (changes) {
	for (let key in changes) {
		settings[key] = changes[key].newValue;
	}
	apply_settings();
});

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

function changeDate(is_week_em) {
	var days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
	var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабрь'];
	var current_datetime = new Date();
	var week = days[current_datetime.getDay()];
	var date = current_datetime.getDate();
	var month = months[current_datetime.getMonth()];
	var year = current_datetime.getFullYear();
	if (is_week_em) {
		$(".date").addClass("em");
		$("#checkbox").prop('checked', true);
		$('.date').text("▲ " + week + ", " + date + " " + month + " " + year + " года");
	} else {
		$(".date").addClass("dn");
		$("#checkbox").prop('checked', false);
		$('.date').text("▼ " + week + ", " + date + " " + month + " " + year + " года");
	}
	day_change();
}

function info_prepair() {
	let preloader = new Preloader($("aside"));
	$.ajax({
		url: "https://api.guap.ru/rasp/custom/get-sem-info",
	}).done(initial_data_received).fail(function () {
		Notify.show("Не удается получить превичные данные");
	});

	function initial_data_received(data) {
		changeDate(data.IsWeekUp);
		chrome.storage.local.get("lastUpdate", function (d) {
			if (d.lastUpdate == data.Update) {
				chrome.storage.local.get("groups", function (data) {
					group_data_received(data, true);
				});
			} else {
				chrome.storage.local.set({ "lastUpdate": data.Update });
				$.ajax({
					url: "https://api.guap.ru/rasp/custom/get-sem-groups",
				}).done(function (data) {
					group_data_received(data, false);
				}).fail(function () {
					chrome.storage.local.set({ "lastUpdate": "" });
					Notify.show("Не удается получить данные группы");
				});
			}
		});
	}

	function group_data_received(data, is_local = false) {

		if (!is_local) {
			for (let i in data) {
				groups[data[i].Name] = data[i].ItemId;
			}
		} else {
			groups = data.groups;
		}
		for (let group in groups) {
			$("#group_num").append($("<option>").text(group));
		}

		//Получение преподавателей
		if (is_local) {
			chrome.storage.local.get("preps", function (data) {
				preps_data_received(data, true);
			});
		} else {
			$.ajax({
				url: "https://api.guap.ru/rasp/custom/get-sem-preps",
			}).done(function (data) { preps_data_received(data, false); }).fail(function () {
				chrome.storage.local.set({ "lastUpdate": "" });
				Notify.show("Не удается получить данные группы");
			});
			chrome.storage.local.set({ "groups": groups });
		}
	}

	function preps_data_received(data, is_local = false) {
		if (!is_local) {
			for (let i in data) {
				preps[data[i].Name] = data[i].ItemId;
			}
		} else {
			preps = data.preps;
		}
		for (let prep in preps) {
			$("#preps").append($("<option>").text(prep));
		}

		if (!is_local) {
			chrome.storage.local.set({ "preps": preps });
		}
		preloader.close();
	}
}

function show_timetable() {
	show_button.attr("disabled", true);
	let preloader = new Preloader($("article"));
	$(".column > div:not(.day_name)").remove();
	additional_lessons.empty();

	if (groups_input.val() in groups)
		$.ajax({
			url: "https://api.guap.ru/rasp/custom/get-sem-rasp/group" + groups[groups_input.val()],
		}).done(rasp_received).fail(load_error);
	else if (preps_input.val() in preps)
		$.ajax({
			url: "https://api.guap.ru/rasp/custom/get-sem-rasp/prep" + preps[preps_input.val()],
		}).done(rasp_received).fail(load_error);
	else {
		groups_input.val("");
		preps_input.val("");
		show_button.attr("disabled", false);
		preloader.close();
	}

	function rasp_received(data) {
		let pairs_time = ["", "1 пара (09:00-10:30)", "2 пара (10:40-12:10)", "3 пара (12:20-13:50)", "4 пара (14:10-15:40)", "5 пара (15:50-17:20)", "6 пара (17:30-19:00)", "7 пара (19:10-20:30)", "8 пара (20:40-22:00)"];
		timetable = {};

		data.sort(function (a, b) {
			return parseFloat(a.Less) - parseFloat(b.Less);
		});

		for (let i in data) {
			timetable[data[i].ItemId] = data[i];
			if (data[i].Day == 0) {
				console.log(data[i]);
				additional_lessons.append(
					$("<div>", { "data-lesson": data[i].ItemId }).append(
						$("<div>", { "class": "type" }).text(data[i].Type),
						$("<div>", { "class": "lesson" }).text(data[i].Disc),
						$("<div>", { "class": "classroom" }).text(data[i].Dept),
					)
				);
			} else {
				$(".column[data-day='" + data[i].Day + "']").append(
					$("<div>", { "data-lesson": data[i].ItemId, "class": data[i].Week == 1 ? "lesson_em" : "lesson_dn" }).append(
						$("<div>", { "class": "time" }).text(pairs_time[data[i].Less]),
						$("<div>", { "class": "type" }).text(data[i].Type),
						$("<div>", { "class": "lesson" }).text(data[i].Disc),
						$("<div>", { "class": "classroom" }).text(data[i].Build + " " + data[i].Rooms),
					)
				);
			}
		}

		preloader.close();
		show_button.attr("disabled", false);
		if (additional_lessons.children().length == 0)
			additional_lessons.text("Пусто :)");
	}

	function load_error() {
		preloader.close();
		show_button.attr("disabled", false);
		Notify.show("Не удается получить расписание");
	}
}