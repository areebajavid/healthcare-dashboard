/**
 * Helper: Converts HH:MM:SS string to total seconds.
 */
const timeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m, s] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

/**
 * MODE_MAP derived from hardware analysis logic
 */
const MODE_MAP = {
  "1": "nCPAP",
  "2": "HFNC",
  "3": "Bubble CPAP",
  "4": "Resuscitation",
  "5": "Settings Screen",
  "0": "Home Screen",
};

/**
 * PHASE 1: GENERATE SESSION REPORT
 */
export const generateSessionReport = (logText) => {
  if (!logText) return [];

  const lines = logText.split(/\r?\n/);
  const reports = [];
  
  let currentPC = 0;
  let sessionInPC = 0;
  let isTherapyActive = false;
  let currentSessionData = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.includes("PuTTY log")) continue;

    if (line.includes("Syt On") || line.match(/Ev:0/)) {
      currentPC++;
      sessionInPC = 0;
      isTherapyActive = false;
      continue;
    }

    const evMatch = line.match(/Ev:([0-9A-G])/);
    const mMatch = line.match(/M:(\d+)/);
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);

    if (evMatch && evMatch[1] === "2") {
      const modeId = mMatch ? mMatch[1] : "0";
      if (["1", "2", "3"].includes(modeId)) {
        sessionInPC++;
        isTherapyActive = true;
        
        currentSessionData = {
          power_cycle_id: currentPC,
          session_id: sessionInPC,
          mode: MODE_MAP[modeId] || "Unknown",
          start_time_str: timeMatch ? timeMatch[1] : "",
          start_ts: timeMatch ? timeToSeconds(timeMatch[1]) : 0,
          last_ev5_ts: null,
          leak_count: 0,
          blockage_count: 0,
          fio2_oob_count: 0,
          fio2_disconnect_count: 0,
          set_pressure: line.match(/SP:(\d+\.\d+)/)?.[1] || "0",
          set_flow: line.match(/SF:(\d+)/)?.[1] || "0",
          set_fio2: line.match(/SO:(\d+)/)?.[1] || "0",
        };
        reports.push(currentSessionData);
      }
    }

    if (isTherapyActive && currentSessionData) {
      if (evMatch) {
        const ev = evMatch[1];
        const currentTime = timeMatch ? timeToSeconds(timeMatch[1]) : 0;
        if (ev === "5") currentSessionData.last_ev5_ts = currentTime;
        if (ev === "6") currentSessionData.leak_count++;
        if (ev === "7") currentSessionData.blockage_count++;
        if (ev === "8") currentSessionData.fio2_oob_count++;
        if (ev === "9") currentSessionData.fio2_disconnect_count++;
        if (ev === "B") isTherapyActive = false;
      }
    }
  }

  return reports.map(s => ({
    ...s,
    fio2_stable_time: s.last_ev5_ts ? (s.last_ev5_ts - s.start_ts) : "N/A",
    overall_pass: s.last_ev5_ts ? (s.last_ev5_ts - s.start_ts <= 180) : false
  }));
};

/**
 * PHASE 2: EXTRACT GRAPH DATA (HIGH RESOLUTION)
 */
export const getGraphData = (logText, targetPC, targetSession) => {
  if (!logText) return [];

  const lines = logText.split(/\r?\n/);
  const pcId = parseInt(targetPC);
  const sessionId = parseInt(targetSession);

  let currentPC = 0;
  let sessionInPC = 0;
  let isTherapyActive = false;
  let sessionStartTime = null;
  let dataPoints = [];
  let previousDacValue = 0; 

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.includes("PuTTY log")) continue;

    if (line.includes("Syt On") || line.match(/Ev:0/)) {
      currentPC++;
      sessionInPC = 0;
      isTherapyActive = false;
      if (currentPC > pcId) break;
      continue;
    }

    if (currentPC === pcId) {
      const evMatch = line.match(/Ev:([0-9A-G])/);
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
      
      if (evMatch && evMatch[1] === "2") {
        sessionInPC++;
        if (sessionInPC === sessionId) {
          isTherapyActive = true;
          if (timeMatch) sessionStartTime = timeToSeconds(timeMatch[1]);
        }
      }

      if (sessionInPC === sessionId && isTherapyActive) {
        const aoMatch = line.match(/AO:(\d+)/);
        const daMatch = line.match(/DA:(\d+)/);

        if (timeMatch && aoMatch) {
          const currentTime = timeToSeconds(timeMatch[1]);
          let elapsed = currentTime - (sessionStartTime || currentTime);
          if (elapsed < 0) elapsed += 86400; // Midnight rollover

          dataPoints.push({
            time: elapsed,
            fio2: parseInt(aoMatch[1]),
            dac: previousDacValue 
          });

          previousDacValue = daMatch ? parseInt(daMatch[1]) : previousDacValue;
        }

        if (evMatch && evMatch[1] === "B") {
          isTherapyActive = false;
          break; 
        }
      }
      if (sessionInPC > sessionId) break;
    }
  }

  return dataPoints; 
};