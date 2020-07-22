"use strict";

let article;
let day_switch;
let additional_lessons_but;
let additional_inf;
let additional_lessons;

$(document).ready(ready);

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

$.ajax({
	url: "https://api.guap.ru/rasp/custom/get-sem-info",
}).done(function (data) {
	console.log(data);
}).fail(function () {
	console.log("error");
});

function ready() {

	article = document.getElementsByTagName("article")[0];
	day_switch = document.getElementById("checkbox");
	additional_lessons_but = document.getElementsByClassName("but_additional_lessons")[0];
	additional_inf = document.getElementsByClassName("additional_inf")[0];
	additional_lessons = document.getElementsByClassName("additional_lessons")[0];


	day_switch.addEventListener("change", day_change, true);
	additional_lessons_but.addEventListener("click", additional_lessons_but_click, true);


	chrome.storage.sync.get(["theme"], function (result) {
		switch (result.theme) {
			case 1:
				$("body").addClass("dark");
				break;
		}
	});

	$("body").addClass("shown");
}

// chrome.storage.sync.set({ 'theme': 0 });