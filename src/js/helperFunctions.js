import axios from "axios";

import chromeStoragePromise from "js/chrome-storage-promise.js";

import config from "config.json"

export async function requestInitialData() {
    let response = await axios.get(config.url.info.initial);
    let initialData = response.data;
    let stored = await chromeStoragePromise.local.get("lastUpdate");
    let groupsList = {};
    let prepsList = {};
    if (!stored.lastUpdate || (stored.lastUpdate.Update != initialData.Update)) {
        chrome.storage.local.set({ lastUpdate: initialData });
        //Получаем список групп            
        let groupsResponse = await axios(config.url.info.groups);
        let groupsData = groupsResponse.data;
        //Превращаем в список id => группа
        for (let i in groupsData) {
            groupsList[groupsData[i].ItemId] = groupsData[i].Name;
        }
        //Получаем список преподавателей
        let prepsResponse = await axios(config.url.info.preps);
        let prepsData = prepsResponse.data;
        //Превращаем в список id => {short => только имя, full => имя вместе с должностью}
        for (let i in prepsData) {
            prepsList[prepsData[i].ItemId] = {
                short: prepsData[i].Name.substring(0, prepsData[i].Name.indexOf("—") - 1),
                full: prepsData[i].Name
            };
        }
        //Сохраняем            
        chrome.storage.local.set({ "groups": groupsList, "preps": prepsList });
    } else {
        let data = await chromeStoragePromise.local.get(["groups", "preps"]);
        groupsList = data.groups;
        prepsList = data.preps;
    }
    return ({ initialInfo: initialData, groups: groupsList, preps: prepsList });
}

export async function requestTimeTable(id, isGroup) {
    let requestUrl = config.url.timetable[(isGroup ? "group" : "prep")] + id;
    let response = await axios(requestUrl);
    let timetable = {};
    let additionalLessons = [];
    for (let lesson of response.data) {
        lesson.Groups = lesson.Groups || "::";
        lesson.Preps = lesson.Preps || "::";
        lesson.Build = lesson.Build || "Не опеределено";
        if (lesson.Day == 0) {
            additionalLessons.push({
                id: lesson.ItemId,
                type: lesson.Type,
                name: lesson.Disc,
                dept: lesson.Dept
            });
        } else {
            timetable[lesson.ItemId] = {};
            timetable[lesson.ItemId].id = lesson.ItemId;
            timetable[lesson.ItemId].week = lesson.Week;
            timetable[lesson.ItemId].day = lesson.Day;
            timetable[lesson.ItemId].num = lesson.Less;
            timetable[lesson.ItemId].type = lesson.Type;
            timetable[lesson.ItemId].name = lesson.Disc;
            timetable[lesson.ItemId].rooms = lesson.Rooms;
            timetable[lesson.ItemId].build = { full: lesson.Build, short: config.build_short_names[lesson.Build] };
            timetable[lesson.ItemId].groupsIds = lesson.Groups.slice(1, -1).split("::").map(Number);
            timetable[lesson.ItemId].prepsIds = lesson.Preps.slice(1, -1).split("::").map(Number);
        }
    }
    return { timetable: timetable, additionalLessons: additionalLessons };
}
