'use strict';
// (async () => {
//     const CS = chrome.runtime.getURL("coursesStatus.js");
//     CSMethods = await import(CS);
// })();

// Start only in /selfregapp/secured/ofrd-course.xhtml
const createData = {
    type: "detached_panel",
    url: "popup.html",
    width: 250,
    height: 100
};
const creating = browser.windows.create(createData);
// document.querySelector('html').style.outline = '10px solid green'