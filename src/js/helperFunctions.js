import axios from "axios";

import Storage from "js/Storage.js"

import config from "config.json"

/**
 * @typedef InitialData
 * @type {object}
 * @property {number} CurrentWeek
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
    let initialData = {
        CurrentWeek: response.data.currentWeek,
        IsWeekUp: (response.data.currentWeek % 2 != 0),
        Update: response.data.dateRelease,
        Years: response.data.years
    };
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
            groupsList[groupsData[i].aisId] = groupsData[i].title;
        }
        //Получаем список преподавателей
        let prepsResponse = await axios(config.url.info.preps);
        let prepsData = prepsResponse.data;
        //Превращаем в список id => {short => только имя, full => имя вместе с должностью}
        for (let i in prepsData) {
            prepsList[prepsData[i].aisId] = {
                short: prepsData[i].fio,
                full: prepsData[i].fio + "—" + prepsData[i].degree
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
 * @property {string} build
 * @property {Array.<number>} groupsIds
 * @property {Array.<number>} prepsIds
 * @property {{begin: string, end: string}} time
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
    let response = await axios.get(config.url.timetable, { params: { groupAisId: (isGroup ? id : 0), prepAisId: (isGroup ? 0 : id) } });
    let timetable = {};
    let additionalLessons = [];
    let regRooms = [];

    for (let roomIt of response.data.regRooms.options) {
        regRooms[roomIt.value] = roomIt.inner.replace("&nbsp;", "\u00a0");
    }

    for (let daysIt of response.data.days) {
        if ('day' in daysIt) {
            for (let lessonsIt of daysIt.lessons) {
                let allWeeks = [...(lessonsIt.week1 || []), ...(lessonsIt.week2 || []), ...(lessonsIt.weekAll || [])];
                for (let lesson of allWeeks) {
                    lesson.week = lesson.week || 0;
                    lesson.groupsAisIds = lesson.groupsAisIds || [];
                    lesson.prepsAisIds = lesson.prepsAisIds || [];
                    lesson.roomsIds = lesson.roomsIds || [];
                    timetable[lesson.id] = {
                        id: lesson.id,
                        week: lesson.week,
                        day: daysIt.day,
                        num: lessonsIt.less,
                        type: lesson.type,
                        name: lesson.dics,
                        rooms: lesson.roomsIds.map((val) => regRooms[val]).join(", "),
                        groupsIds: lesson.groupsAisIds || [],
                        prepsIds: lesson.prepsAisIds || [],
                        time: {
                            begin: lessonsIt.begin,
                            end: lessonsIt.end
                        }
                    };
                }
            }
        } else {
            for (let lessonsIt of daysIt.lessons[0].weekAll) {
                lessonsIt.roomsIds = lessonsIt.roomsIds || [];
                additionalLessons.push({
                    id: lessonsIt.id,
                    type: lessonsIt.type,
                    name: lessonsIt.dics,
                    dept: lessonsIt.roomsIds.map((val) => regRooms[val]).join(", ")
                });
            }
        }
    }
    return { timetable: timetable, additionalLessons: additionalLessons };
}
