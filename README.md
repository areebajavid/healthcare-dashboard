# 🏥 SAANS Healthcare Dashboard

> A real-time monitoring dashboard for respiratory medical devices — streaming live sensor data from Android-connected devices with historical log analysis.

![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)

---

## ✨ Features

- 📡 **Live Monitoring** — Real-time WebSocket data from Android-connected medical devices
- 📊 **Dynamic Charts** — Mode-specific live line charts with adaptive Y-axes
- 🚨 **Visual Alerts** — Device notifications displayed in real-time
- 📁 **Log File Analysis** — Upload and parse `.log` files for historical session review
- 🔍 **Advanced Filtering** — Filter sessions by PASS/FAIL, mode, Session ID, or Power Cycle ID
- 🔌 **Connection Status** — Live indicator for device connectivity

---

## 🩺 Supported Device Modes

| Mode | Parameters Monitored |
|------|---------------------|
| nCPAP | Pressure · FiO₂ |
| Bubble CPAP | Pressure · FiO₂ · Flow |
| HFNC | FiO₂ · Flow |
| Resuscitation | PEEP · PIP · FiO₂ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TailwindCSS, Recharts, Lucide React |
| Backend | Node.js + Express |
| Real-time | Socket.io (WebSockets) |
| File Handling | Multer |
| Charts | Recharts + Chart.js |

---

## 📁 Project Structure

```
healthcare-dashboard/
├── server/
│   ├── index.js              # Express + Socket.io server
│   └── utils/
│       └── logParser.js      # Log file parsing utility
├── src/
│   ├── components/
│   │   ├── PatientList.jsx
│   │   └── SessionMetricsChart.jsx
│   ├── utils/
│   │   └── logParser.js      # Frontend log parsing
│   └── App.js                # Main React component
├── tailwind.config.js
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- Android app connected to a medical device (for live mode)

### Backend

```bash
cd server
npm install
node index.js
# Runs on http://localhost:5000
```

### Frontend

```bash
npm install
npm start
# Runs on http://localhost:3000
```

> ⚠️ For device testing, update the Android app's target IP from `localhost` to your machine's local IP address.

---

## 📡 API & WebSocket Reference

### REST Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload-log` | Upload `.log` file for parsing (`multipart/form-data`) |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `sensorData` | Android → Server | Live sensor payload from device |
| `updateDashboard` | Server → Frontend | Forwarded sensor data to UI |

### Sensor Payload Schema

```json
{
  "mode": "HFNC",
  "actualFlow": 8.0,
  "actualFiO2": 40,
  "actualPressure": 5.0,
  "setPressure": 5.0,
  "setFlow": 8.0,
  "setFiO2": 40,
  "setPEEP": null,
  "setPIP": null,
  "alertText": "",
  "timestamp": "2026-04-28T10:00:00Z"
}
```

---

## 📊 Chart Configuration by Mode

| Mode | Y-Axis 1 | Y-Axis 2 | Y-Axis 3 |
|------|----------|----------|----------|
| nCPAP | Pressure (cmH₂O) | FiO₂ (%) | — |
| Bubble CPAP | Pressure (cmH₂O) | FiO₂ (%) | Flow (LPM) |
| HFNC | FiO₂ (%) | Flow (LPM) | — |
| Resuscitation | Pressure (cmH₂O) | FiO₂ (%) | — |

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `socket.io-client` | Real-time WebSocket client |
| `recharts` | Live data charts |
| `chart.js` + `react-chartjs-2` | Session metrics charts |
| `tailwindcss` | Styling |
| `lucide-react` | Icons |
| `multer` | Log file uploads |

---

## 📄 License

MIT License © 2026
