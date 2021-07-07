
//id of current opened app tab 
let tab_id = chrome.tabs.TAB_ID_NONE;

//call openTimetable on click on browserAction
chrome.action.onClicked.addListener(openApp);

//clear tab_id if app tab is closed
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	if (tab_id == tabId)
		tab_id = chrome.tabs.TAB_ID_NONE;
});

//shortcuts command
chrome.commands.onCommand.addListener(function (command) {
	if (command = "openApp")
		openApp();
});

//open new or focus to app tab
function openApp() {
	if (tab_id == chrome.tabs.TAB_ID_NONE)
		chrome.tabs.create({ url: chrome.runtime.getURL("app/index.html") }, function (tab) { tab_id = tab.id; });
	else
		chrome.tabs.update(tab_id, { active: true });
}
