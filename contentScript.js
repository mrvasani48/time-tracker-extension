const targetDayDuration = { hours: 7, minutes: 20, seconds: 0 };  // Target day duration
const targetWeekDuration = { hours: 41, minutes: 40, seconds: 0 }; // Target week duration

// Convert time to seconds
function convertToSeconds(duration) {
  return duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
}

// Get the remaining time given the target duration and the current duration
function getRemainingTime(elapsedTimeInSeconds, targetDurationInSeconds) {
  const remainingSeconds = Math.max(0, targetDurationInSeconds - elapsedTimeInSeconds);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = Math.floor(remainingSeconds % 60);

  return { hours, minutes, seconds };
}

function getTimeInfo() {
  const durationNode = document.getElementsByClassName('globalTable-Table-td')[4];
  if (!durationNode) {
    console.error('Duration node not found');
    return null;
  }

  const durationValue = durationNode.children[0].children[0].innerHTML.split(':');
  const initialDurationInSeconds = Number(durationValue[0]) * 3600 + Number(durationValue[1]) * 60 + Number(durationValue[2]);

  const targetDayDurationInSeconds = convertToSeconds(targetDayDuration);

  // Calculate the remaining time
  let remainingTime = getRemainingTime(initialDurationInSeconds, targetDayDurationInSeconds);
  const formattedRemainingTime = formatTime(remainingTime);

  // Set interval to update remaining time every second
  const interval = setInterval(() => {
    remainingTime = getRemainingTime(initialDurationInSeconds, targetDayDurationInSeconds);
    
    if (remainingTime.hours === 0 && remainingTime.minutes === 0 && remainingTime.seconds === 0) {
      clearInterval(interval); // Stop when remaining time reaches 0
    }

  }, 1000); // Update every second

  // Create leave time (time when target day duration will be completed)
  const currentTime = new Date();
  const leaveTime = new Date(currentTime.getTime() + (remainingTime.hours * 3600 + remainingTime.minutes * 60 + remainingTime.seconds) * 1000);
  
  const remainingWeekTime = calculateRemainingWeekTimeDirect();
  const remainingToTarget = calculateRemainingToTarget();

  return {
    targetDay: formatDuration(targetDayDuration),
    remaining: formattedRemainingTime,
    leaveAt: formatDate(leaveTime),
    targetWeek: formatDuration(targetWeekDuration),
    remainingWeek: remainingWeekTime,
    remainingToTarget: remainingToTarget
  };
}

function calculateRemainingWeekTimeDirect() {
  const timeElement = document.getElementsByClassName('inexture-Text-root')[7];
  if (timeElement) {
    const timeText = timeElement.innerHTML.trim();
    const [hours, minutes, seconds] = timeText.replace('s', '').split(/[hms]/).map(Number);
    const extractedSeconds = hours * 3600 + minutes * 60 + seconds;

    const targetWeekSeconds = convertToSeconds(targetWeekDuration);

    const remainingSeconds = targetWeekSeconds - extractedSeconds;

    if (remainingSeconds < 0) {
      console.warn("Target week time exceeded!");
      return "Target week time exceeded!";
    }

    const remainingHours = Math.floor(remainingSeconds / 3600);
    const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
    const remainingSecs = remainingSeconds % 60;

    return `${remainingHours}h ${remainingMinutes}m ${remainingSecs}s`;
  } else {
    console.error('Time element not found.');
    return "Error: Time element not found.";
  }
}

function calculateRemainingToTarget() {
  const targetSeconds = convertToSeconds(targetWeekDuration);

  const durationNode = document.getElementsByClassName('globalTable-Table-td')[4];
  if (!durationNode) {
    console.error('Duration node not found');
    return "Error: Duration node not found.";
  }

  const currentDuration = durationNode.children[0].children[0].innerHTML;
  const [currentHours, currentMinutes, currentSeconds] = currentDuration.split(':').map(Number);
  const currentDurationSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

  const timeElement = document.getElementsByClassName('inexture-Text-root')[7];
  if (!timeElement) {
    console.error('Time element not found.');
    return "Error: Time element not found.";
  }

  const timeText = timeElement.innerHTML.trim();
  const [timeHours, timeMinutes, timeSeconds] = timeText.replace('s', '').split(/[hms]/).map(Number);
  const timeElementSeconds = timeHours * 3600 + timeMinutes * 60 + timeSeconds;

  const totalElapsedSeconds = currentDurationSeconds + timeElementSeconds;

  const remainingSeconds = Math.max(0, targetSeconds - totalElapsedSeconds);

  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
  const remainingSecs = remainingSeconds % 60;

  return `${remainingHours}h ${remainingMinutes}m ${remainingSecs}s`;
}

function formatTime(remainingTime) {
  return `${remainingTime.hours.toString().padStart(2, '0')}:${remainingTime.minutes.toString().padStart(2, '0')}:${remainingTime.seconds.toString().padStart(2, '0')}`;
}

function formatDuration(duration) {
  return `${duration.hours}h ${duration.minutes}m ${duration.seconds}s`;
}

function formatDate(date) {
  return date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getTimeInfo") {
    sendResponse({ timeInfo: getTimeInfo() });
  }
});
