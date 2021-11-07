import axios from "axios";

import Storage from "js/Storage.js"

import config from "config.json"

/**
 * @typedef InitialData
 * @type {object}
 * @property {number} CurrentWeek
 * @property {boolean} IsAutumn
 * @property {boolean} IsWeekOdd
 * @property {boolean} IsWeekRed
 * @property {boolean} IsWeekUp
 * @property {string} Update
 * @property {string} Years
 */

/**
 * Returns initial data, groups and preps
 * 
 * @returns {Promise<{initialInfo:InitialData,groups:Object.<number,string>,preps:Object.<number,{short:string,full:string}>}>}
 */
export async function requestInitialData() {
    let response = await axios.get(config.url.info.initial);
    let initialData = response.data;
    let lastUpdate = await Storage.getLastUpdate();
    let groupsList = {};
    let prepsList = {};
    if (lastUpdate != initialData.Update) {
        Storage.saveLastUpdate(initialData.Update);
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
        Storage.saveGroupsPrepsLists(groupsList, prepsList);
    } else {
        let data = await Storage.getGroupsPrepsLists();
        groupsList = data.groups;
        prepsList = data.preps;
    }
    return ({ initialInfo: initialData, groups: groupsList, preps: prepsList });
}

/**
 * @typedef Lesson
 * @type {object}
 * @property {number} id
 * @property {number} week
 * @property {number} day
 * @property {number} num
 * @property {string} type
 * @property {string} name
 * @property {string} rooms
 * @property {{full: string, short: string}} build
 * @property {Array.<number>} groupsIds
 * @property {Array.<number>} prepsIds
 */

/**
 * @typedef AdditionalLesson
 * @type {object}
 * @property {number} id
 * @property {string} type
 * @property {string} name
 * @property {string} dept
 */

/**
 * Returns TimeTable and additional lessons for specified id
 * 
 * @param {number} id 
 * @param {boolean} isGroup 
 * 
 * @returns {Promise<{timetable:Object.<number,Lesson>,additionalLessons:Array.<AdditionalLesson>}>}
 */
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
            timetable[lesson.ItemId].rooms = lesson.Rooms || "";
            timetable[lesson.ItemId].build = { full: lesson.Build, short: config.build_short_names[lesson.Build] };
            timetable[lesson.ItemId].groupsIds = lesson.Groups.slice(1, -1).split("::").map(Number);
            timetable[lesson.ItemId].prepsIds = lesson.Preps.slice(1, -1).split("::").map(Number);
        }
    }
    return { timetable: timetable, additionalLessons: additionalLessons };
}
