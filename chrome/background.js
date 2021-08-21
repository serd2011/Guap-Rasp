chrome.action.onClicked.addListener(openApp);

chrome.commands.onCommand.addListener(function (command) {
	if (command = "openApp")
		openApp();
});

//open new or focus to app tab
async function openApp() {
	let appUrl = chrome.runtime.getURL("app/index.html");
	let tabs = await chrome.tabs.query({ url: appUrl });

	if (tabs.length === 0)
		return chrome.tabs.create({ url: appUrl });

	let currentWindow = await chrome.windows.getCurrent();
	for (let tab of tabs) {
		if (tab.windowId == currentWindow.id)
			return chrome.tabs.update(tab.id, { active: true });
	}
	chrome.tabs.update(tabs[0].id, { active: true });
	chrome.windows.update(tabs[0].windowId, { focused: true });
}
