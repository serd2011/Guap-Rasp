//id of current opened app tab 
let tab_id = chrome.tabs.TAB_ID_NONE;

//open new or focus to app tab
chrome.browserAction.onClicked.addListener(function (activeTab) {
	if (tab_id == chrome.tabs.TAB_ID_NONE)
		chrome.tabs.create({ url: chrome.extension.getURL("app/index.html") }, function (tab) { tab_id = tab.id; });
	else
		chrome.tabs.update(tab_id, { active: true });
});

//clear tab_id if app tab is closed
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	if (tab_id == tabId)
		tab_id = chrome.tabs.TAB_ID_NONE;
});