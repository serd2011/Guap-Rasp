"use strict";

let article;
let day_switch;
let additional_lessons_but;
let additional_inf;
let additional_lessons;

$(document).ready(ready);

$.ajax({
	url: "https://api.guap.ru/rasp/custom/get-sem-info",
}).done(function (data) {
	console.log(data);
	set_as_loaded("info");
}).fail(function () {
	console.log("error");
});

let is_loaded = { "settings": false, "info": false, "timeout": false };

setTimeout(set_as_loaded, 3000, "timeout");

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
		set_as_loaded("settings")
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
	for (var key in changes) {
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

function getWeekNumber(d) {
	d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
	return weekNo;
}

function changeDate() {
	var days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
	var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабрь'];
	var current_datetime = new Date();
	var week = days[current_datetime.getDay()];
	var date = current_datetime.getDate();
	var month = months[current_datetime.getMonth()];
	var year = current_datetime.getFullYear();
	if (getWeekNumber(current_datetime) % 2 == 0) {
		$(".date").addClass("em");
		$("#checkbox").prop('checked', true);
		day_change();
		return "▲ " + week + ", " + date + " " + month + " " + year + " года";
	}
	$("#checkbox").prop('checked', false);
	$(".date").addClass("dn");
	day_change();
	return "▼ " + week + ", " + date + " " + month + " " + year + " года";
}

$(document).ready(function () {
	$('.date').text(changeDate);
});