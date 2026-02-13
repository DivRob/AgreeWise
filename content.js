// This listens for the "Brain" (popup.js) to ask for text
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getText") {
        sendResponse({ text: document.body.innerText });
    }
    return true; // Keep the message channel open for async responses
});