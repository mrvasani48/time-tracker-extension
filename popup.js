document.addEventListener('DOMContentLoaded', function () {
    // Redirect to https://portal.inexture.com/time-entry if not already there
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tab = tabs[0];
        if (tab && tab.url !== 'https://portal.inexture.com/time-entry') {
            chrome.tabs.update(tab.id, { url: 'https://portal.inexture.com/time-entry' });
            return; // Prevent further popup logic from running
        }
        // Continue with the rest of the popup logic if already on the correct URL
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

        // New functionality for editing and saving durations
        const dayHoursInput = document.getElementById('day-hours');
        const dayMinutesInput = document.getElementById('day-minutes');
        const daySecondsInput = document.getElementById('day-seconds');
        const weekHoursInput = document.getElementById('week-hours');
        const weekMinutesInput = document.getElementById('week-minutes');
        const weekSecondsInput = document.getElementById('week-seconds');

        const saveDayButton = document.getElementById('save-day-duration');
        const saveWeekButton = document.getElementById('save-week-duration');

        const defaultDayDuration = { hours: 8, minutes: 20, seconds: 0 }; // Default day duration
        const defaultWeekDuration = { hours: 41, minutes: 40, seconds: 0 }; // Default week duration
        
        // Load stored durations and prefill inputs
        chrome.storage.local.get(['targetDayDuration', 'targetWeekDuration', 'leaveDays'], (result) => {
            // Handle targetDayDuration
            let dayDuration;
            if (result.targetDayDuration) {
                dayDuration = JSON.parse(result.targetDayDuration);
            } else {
                dayDuration = defaultDayDuration;
            }
            dayHoursInput.value = dayDuration.hours;
            dayMinutesInput.value = dayDuration.minutes;
            daySecondsInput.value = dayDuration.seconds;

            // Handle leaveDays and update dropdown UI
            let leaveDays = result.leaveDays || '0';
            leaveDaysSelect.value = leaveDays;

            // Handle targetWeekDuration
            let weekDuration;
            if (result.targetWeekDuration) {
                weekDuration = JSON.parse(result.targetWeekDuration);
            } else {
                weekDuration = defaultWeekDuration;
            }
            weekHoursInput.value = weekDuration.hours;
            weekMinutesInput.value = weekDuration.minutes;
            weekSecondsInput.value = weekDuration.seconds;
        });
        

        // Helper to reload the active tab
        function reloadActiveTab() {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        }

        // Save Target Day Duration
        saveDayButton.addEventListener('click', () => {
            const dayDuration = {
                hours: parseInt(dayHoursInput.value || '0', 10),
                minutes: parseInt(dayMinutesInput.value || '0', 10),
                seconds: parseInt(daySecondsInput.value || '0', 10),
            };
            chrome.storage.local.set({ targetDayDuration: JSON.stringify(dayDuration) }, () => {
                document.getElementById('target-day').textContent = `${dayDuration.hours}h ${dayDuration.minutes}m ${dayDuration.seconds}s`;
                alert('Target Day Duration updated successfully!');
                reloadActiveTab();
            });
        });

        // Add mapping for leave days to week duration
        const leaveDaysSelect = document.getElementById('leave-days');
        const weekDurationMap = {
            '0':   { hours: 41, minutes: 40, seconds: 0 },
            '0.5': { hours: 37, minutes: 40, seconds: 0 },
            '1':   { hours: 33, minutes: 20, seconds: 0 },
            '1.5': { hours: 29, minutes: 20, seconds: 0 },
            '2':   { hours: 25, minutes: 0,  seconds: 0 },
            '2.5': { hours: 21, minutes: 0,  seconds: 0 },
            '3':   { hours: 16, minutes: 40, seconds: 0 },
            '3.5': { hours: 13, minutes: 20, seconds: 0 },
            '4':   { hours: 8,  minutes: 20, seconds: 0 },
            '4.5': { hours: 4,  minutes: 20, seconds: 0 },
            '5':   { hours: 0,  minutes: 0,  seconds: 0 }
        };
        leaveDaysSelect.addEventListener('change', function() {
            const val = leaveDaysSelect.value;
            const dur = weekDurationMap[val];
            setWeekDuration(dur.hours, dur.minutes, dur.seconds);
            // Store leaveDays in local storage
            chrome.storage.local.set({ leaveDays: val });
        });

        // Helper to set week duration fields
        function setWeekDuration(hours, minutes, seconds) {
            weekHoursInput.value = hours;
            weekMinutesInput.value = minutes;
            weekSecondsInput.value = seconds;
        }

        // Save Target Week Duration
        saveWeekButton.addEventListener('click', () => {
            let weekDuration = {
                hours: parseInt(weekHoursInput.value || '0', 10),
                minutes: parseInt(weekMinutesInput.value || '0', 10),
                seconds: parseInt(weekSecondsInput.value || '0', 10)
            };
            chrome.storage.local.set({
                targetWeekDuration: JSON.stringify(weekDuration)
            }, () => {
                document.getElementById('target-week').textContent = `${weekDuration.hours}h ${weekDuration.minutes}m ${weekDuration.seconds}s`;
                alert('Target Week Duration updated successfully!');
                reloadActiveTab();
            });
        });
    });
});
