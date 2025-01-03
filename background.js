// background.js
chrome.runtime.onInstalled.addListener(function () {
    console.log('Time Tracker Extension installed!');
  });
  
  // Listener for messages sent from the popup or content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimeInfo") {
      // Handle time tracking logic or fetch data
      getTimeInfo().then((timeInfo) => {
        sendResponse({ timeInfo: timeInfo });
      });
      return true;  // Indicate async response
    }
  });
  
  // Function to fetch or compute time information
  async function getTimeInfo() {
    // Example: Fetch the current time info (this can be customized based on your needs)
    const timeInfo = {
      targetDay: "7h 20m 0s",
      remaining: "3h 45m 15s",
      leaveAt: "18:30:00",
      targetWeek: "41h 40m 0s",
      remainingWeek: "20h 35m 45s",
      remainingToTarget: "10h 30m 15s",
    };
  
    return timeInfo;
  }
  