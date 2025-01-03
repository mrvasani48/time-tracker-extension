document.addEventListener('DOMContentLoaded', function () {
    const targetDayDuration = { hours: 7, minutes: 20, seconds: 0 };
    const targetWeekDuration = { hours: 41, minutes: 40, seconds: 0 };

    // Update the time info every 1 second
    function updateTimeInfo() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getTimeInfo" }, function (response) {
                if (response && response.timeInfo) {
                    updateDisplay(response.timeInfo);
                }
            });
        });
    }

    // Formatting functions
    function formatDuration(duration) {
        return `${duration.hours}h ${duration.minutes}m ${duration.seconds}s`;
    }

    function formatTime(time) {
        return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`;
    }

    function formatDate(date) {
        return date.toTimeString().split(' ')[0];
    }

    // Update the UI with the fetched time info
    function updateDisplay(timeInfo) {
        document.getElementById('target-day').textContent = timeInfo.targetDay;
        document.getElementById('remaining').textContent = timeInfo.remaining;
        document.getElementById('leave-at').textContent = timeInfo.leaveAt;
        document.getElementById('target-week').textContent = timeInfo.targetWeek;
        document.getElementById('remaining-week').textContent = timeInfo.remainingWeek;
        document.getElementById('remaining-to-target').textContent = timeInfo.remainingToTarget;
    }

    // Initially update time info and set interval to update every 1 second
    updateTimeInfo();
    setInterval(updateTimeInfo, 1000);
});
