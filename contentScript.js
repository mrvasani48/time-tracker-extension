let targetDayDuration = { hours: 0, minutes: 0, seconds: 0 };  // Target day duration
let targetWeekDuration = { hours: 0, minutes: 0, seconds: 0 }; // Target week duration

chrome.storage.local.get('targetDayDuration', (result) => {
  if (chrome.runtime.lastError) {
    console.error('Error retrieving targetDayDuration:', chrome.runtime.lastError);
    return;
  }

   targetDayDuration = result.targetDayDuration 
    ? JSON.parse(result.targetDayDuration) 
    : null;

  if (targetDayDuration) {
    console.log('Retrieved targetDayDuration:', targetDayDuration);
  } else {
    console.warn('targetDayDuration not found in storage.');
  }
});

chrome.storage.local.get('targetWeekDuration', (result) => {
  if (chrome.runtime.lastError) {
    console.error('Error retrieving targetDayDuration:', chrome.runtime.lastError);
    return;
  }

   targetWeekDuration = result.targetWeekDuration 
    ? JSON.parse(result.targetWeekDuration) 
    : null;

  if (targetWeekDuration) {
    console.log('Retrieved targetWeekDuration:', targetWeekDuration);
  } else {
    console.warn('targetDayDuration not found in storage.');
  }
});


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
  const startElement = document.getElementsByClassName('globalTable-Table-td')[1]

  let startTime = startElement.querySelector('div > div > span').innerHTML.split(':');
  startTime = startTime.map(Number); // Convert to numbers

  const companyStartTime = [10, 0, 0];
  

  // Compare startTime with companyStartTime
  let isBeforeCompanyTime = false;
  let diffWithCompanyTime = null;
  // Convert both times to seconds for comparison
  const startSeconds = startTime[0] * 3600 + startTime[1] * 60 + (startTime[2] || 0);
  const companySeconds = companyStartTime[0] * 3600 + companyStartTime[1] * 60 + (companyStartTime[2] || 0);
  if (startSeconds < companySeconds) {
    isBeforeCompanyTime = true;
    let diffSeconds = companySeconds - startSeconds;
    const diffHours = Math.floor(diffSeconds / 3600);
    diffSeconds = diffSeconds % 3600;
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffSecs = diffSeconds % 60;
    diffWithCompanyTime = `${diffHours}h ${diffMinutes}m ${diffSecs}s`;
  }
  const durationNode = document.getElementsByClassName('globalTable-Table-td')[4];
  if (!durationNode) {
    console.error('Duration node not found');
    return null;
  }

  const durationValue = durationNode.children[0].children[0].innerHTML.split(':');
  const initialDurationInSeconds = Number(durationValue[0]) * 3600 + Number(durationValue[1]) * 60 + Number(durationValue[2]);

  const targetDayDurationInSeconds = convertToSeconds(targetDayDuration);

  // Calculate the extra seconds if started before company time
  let extraSecondsIfEarly = 0;
  if (isBeforeCompanyTime && diffWithCompanyTime) {
    const match = diffWithCompanyTime.match(/(\d+)h\s+(\d+)m\s+(\d+)s/);
    if (match) {
      const extraHours = parseInt(match[1], 10);
      const extraMinutes = parseInt(match[2], 10);
      const extraSeconds = parseInt(match[3], 10);
      extraSecondsIfEarly = extraHours * 3600 + extraMinutes * 60 + extraSeconds;
    }
  }

  // Always use live worked time and correct variables
  let totalTargetSeconds = targetDayDurationInSeconds + extraSecondsIfEarly;
  let workedSecondsLive = 0;
  const durationNodeLive = document.getElementsByClassName('globalTable-Table-td')[4];
  if (durationNodeLive) {
    const durationValueLive = durationNodeLive.children[0].children[0].innerHTML.split(':');
    workedSecondsLive = Number(durationValueLive[0]) * 3600 + Number(durationValueLive[1]) * 60 + Number(durationValueLive[2]);
  }
  let remainingSecondsLive = Math.max(0, totalTargetSeconds - workedSecondsLive);
  let remainingTime = {
    hours: Math.floor(remainingSecondsLive / 3600),
    minutes: Math.floor((remainingSecondsLive % 3600) / 60),
    seconds: remainingSecondsLive % 60
  };
  const formattedRemainingTime = formatTime(remainingTime);
  const now = new Date();
  let leaveTime, formattedLeaveTime;
  if (remainingSecondsLive === 0) {
    leaveTime = now;
    formattedLeaveTime = formatDuration({ hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds() });
  } else {
    leaveTime = new Date(now.getTime() + remainingSecondsLive * 1000);
    formattedLeaveTime = formatDuration({ hours: leaveTime.getHours(), minutes: leaveTime.getMinutes(), seconds: leaveTime.getSeconds() });
  }

  let remainingWeekTime = calculateRemainingWeekTimeDirect();
  let remainingToTarget = calculateRemainingToTarget();

  // If employee started before company time, add extra hours needed to remaining week/target
  let extraHoursNote = null;
  if (isBeforeCompanyTime && diffWithCompanyTime) {
    extraHoursNote = `Employee needs to work extra: ${diffWithCompanyTime}`;
    // Optionally, you can parse and add this time to remainingWeekTime/remainingToTarget if those are in seconds or can be parsed
    // Here, just append the info for clarity
    remainingWeekTime += ` (+${diffWithCompanyTime} extra)`;
    remainingToTarget += ` (+${diffWithCompanyTime} extra)`;
  }

  return {
    targetDay: formatDuration(targetDayDuration),
    remaining: formattedRemainingTime,
    leaveAt: formattedLeaveTime,
    targetWeek: formatDuration(targetWeekDuration),
    remainingWeek: remainingWeekTime,
    remainingToTarget: remainingToTarget,
    isBeforeCompanyTime: isBeforeCompanyTime,
    diffWithCompanyTime: diffWithCompanyTime,
    extraHoursNote: extraHoursNote
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
