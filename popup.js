document.addEventListener('DOMContentLoaded', function () {
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

    const defaultDayDuration = { hours: 8, minutes: 22, seconds: 0 }; // Default day duration
    const defaultWeekDuration = { hours: 41, minutes: 40, seconds: 0 }; // Default week duration
    
    // Load stored durations and prefill inputs
    chrome.storage.local.get(['targetDayDuration', 'targetWeekDuration'], (result) => {
        // Handle targetDayDuration
        let dayDuration;
        if (result.targetDayDuration) {
            dayDuration = JSON.parse(result.targetDayDuration);
        } else {
            dayDuration = defaultDayDuration;
            chrome.storage.local.set({ targetDayDuration: JSON.stringify(defaultDayDuration) }, () => {
                console.log('Default targetDayDuration set.');
            });
        }
    
        // Prefill day duration inputs
        dayHoursInput.value = dayDuration.hours;
        dayMinutesInput.value = dayDuration.minutes;
        daySecondsInput.value = dayDuration.seconds;
    
        // Handle targetWeekDuration
        let weekDuration;
        if (result.targetWeekDuration) {
            weekDuration = JSON.parse(result.targetWeekDuration);
        } else {
            weekDuration = defaultWeekDuration;
            chrome.storage.local.set({ targetWeekDuration: JSON.stringify(defaultWeekDuration) }, () => {
                console.log('Default targetWeekDuration set.');
            });
        }
    
        // Prefill week duration inputs
        weekHoursInput.value = weekDuration.hours;
        weekMinutesInput.value = weekDuration.minutes;
        weekSecondsInput.value = weekDuration.seconds;
    });
    

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
        });
    });

    // Save Target Week Duration
    saveWeekButton.addEventListener('click', () => {
        const weekDuration = {
            hours: parseInt(weekHoursInput.value || '0', 10),
            minutes: parseInt(weekMinutesInput.value || '0', 10),
            seconds: parseInt(weekSecondsInput.value || '0', 10),
        };
        chrome.storage.local.set({ targetWeekDuration: JSON.stringify(weekDuration) }, () => {
            document.getElementById('target-week').textContent = `${weekDuration.hours}h ${weekDuration.minutes}m ${weekDuration.seconds}s`;
            alert('Target Week Duration updated successfully!');
        });
    });
});
