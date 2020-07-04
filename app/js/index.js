"use strict";

let article;
let day_switch;
let additional_lessons_but;
let additional_inf;
let additional_lessons;

let groups = {};
let preps = {};

$(document).ready(ready);

let is_loaded = { "settings": false, "timeout": false };

setTimeout(set_as_loaded, 500, "timeout");

function set_as_loaded(type) {
	is_loaded[type] = true;

	if (is_all_true(is_loaded)) {
		$("#main-preloader").animate({ opacity: 0 }, 400, function () { $(this).remove(); });
	}

	function is_all_true(obj) {
		for (var o in obj)
			if (!obj[o]) return false;
		return true;
	}
}

function ready() {
	page_prepair();
	settings_prepair();
	info_prepair();
}

function page_prepair() {
	article = document.getElementsByTagName("article")[0];
	day_switch = document.getElementById("checkbox");
	additional_lessons_but = document.getElementsByClassName("but_additional_lessons")[0];
	additional_inf = document.getElementsByClassName("additional_inf")[0];
	additional_lessons = document.getElementsByClassName("additional_lessons")[0];


	day_switch.addEventListener("change", day_change, true);

	additional_lessons_but.addEventListener("click", additional_lessons_but_click, true);

	$("#settings-button-open").click(settings_open);
	$("#settings-button-close").click(settings_close);
	$("#settings-background").click(settings_close);

	$("#settings-block *[data-role='control']").each(function () {
		$(this).change(setting_changed);
	});
}

let settings = {};

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
		set_as_loaded("settings");
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
		additional_lessons.classList.add("display_none");
	} else {
		additional_inf.classList.add("display_none");
		additional_lessons.classList.remove("display_none");
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
		Error.showError("Не удается получить превичные данные");
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
					Error.showError("Не удается получить данные группы");
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
				Error.showError("Не удается получить данные группы");
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

class Preloader {
	constructor($wrapper) {
		this.preloader = $("<div>", { "class": "preloader" }).load('./img/preloader.svg').appendTo($wrapper);
	}
	close() {
		this.preloader.animate({ opacity: 0 }, 200, function () { $(this).remove(); });
	}
}