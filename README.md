<div align="center">
  
# 🏥 SAANS Healthcare Dashboard

### *Real-Time Respiratory Device Monitoring System*

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

</div>

---

## 📌 Project Overview

> **A real-time dashboard for monitoring respiratory medical devices (CPAP, HFNC, Bubble CPAP, Resuscitation) with live data streaming and log file analysis.**

This system receives live sensor data from an Android app connected to medical devices, displays real-time metrics, and allows historical analysis through uploaded log files.

### Supported Device Modes:
| Mode | Parameters Monitored |
|------|---------------------|
| **nCPAP** | Pressure + FiO₂ |
| **Bubble CPAP** | Pressure + FiO₂ + Flow |
| **HFNC** | FiO₂ + Flow |
| **Resuscitation** | PEEP + PIP + FiO₂ |

---

## 🏗️ Architecture
┌─────────────────┐ WebSocket ┌─────────────────┐
│ Android App │ ─────────────────► │ Express Server │
│ (Medical Device│ (sensorData) │ (Port 5000) │
│ Integration) │ └────────┬────────┘
└─────────────────┘ │
│ Socket.io
▼
┌─────────────────────────────────────────────────────────┐
│ React Frontend (Port 3000) │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Live View │ │ History View │ │ File Upload │ │
│ │ - Real-time │ │ - Log Parser│ │ - .log files│ │
│ │ - Charts │ │ - Session │ │ - Session │ │
│ │ - Alerts │ │ Analysis │ │ Storage │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────┘


---

## ✨ Features (What Actually Exists)

### Live Monitoring Tab
- Real-time WebSocket connection to Android device
- Mode-specific metrics display (Pressure, FiO₂, Flow, PEEP, PIP)
- Live line charts with dynamic Y-axes based on selected mode
- Visual alerts for device notifications
- Connection status indicator

### History Tab
- Upload `.log` files from medical devices
- Parse and display session data
- Filter sessions by PASS/FAIL status
- Filter by Mode (HFNC, Bubble CPAP, nCPAP)
- Search by Session ID (SID) or Power Cycle ID (PCID)
- View detailed session metrics charts

---

## 🛠️ Tech Stack (From Your Actual Code)

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18.3, TailwindCSS, Recharts, Lucide React |
| **Backend** | Express.js, Socket.io, Multer, Cors |
| **Real-time** | WebSockets (Socket.io) |
| **Charts** | Recharts, Chart.js |
| **HTTP Client** | Fetch API |

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js (v16+)
npm


Backend Setup
# Navigate to server folder
cd server

# Install dependencies
npm install

# Start backend server (port 5000)
node index.js

Frontend Setup
# In root directory
npm install

# Start React app (port 3000)
npm start


Environment Requirements
Backend runs on http://localhost:5000

Frontend connects to backend via Socket.io

Android app sends data to http://localhost:5000 (update IP for device testing)


📁 Project Structure (Actual)
healthcare-dashboard/
├── public/                 # Static assets
├── server/
│   ├── index.js           # Express + Socket.io server
│   └── utils/
│       └── logParser.js   # Log file parsing utility
├── src/
│   ├── components/
│   │   ├── PatientList.jsx
│   │   └── SessionMetricsChart.jsx
│   ├── utils/
│   │   └── logParser.js   # Frontend log parsing
│   ├── App.js             # Main React component
│   └── index.js
├── package.json
├── tailwind.config.js
└── .gitignore


📡 API Endpoints
Method	Endpoint	Description
POST	/api/upload-log	Upload .log file for parsing (multipart/form-data)




WebSocket Events
Event	Direction	Payload
sensorData	Android → Server	{ mode, actualFlow, actualFiO2, actualPressure, setPressure, setFlow, setFiO2, setPEEP, setPIP, alertText, timestamp }
updateDashboard	Server → Frontend	Same as above



📊 Chart Configurations by Mode
Mode	Y-Axis 1	Y-Axis 2	Y-Axis 3
nCPAP	Pressure (cmH₂O)	FiO₂ (%)	-
Bubble CPAP	Pressure (cmH₂O)	FiO₂ (%)	Flow (LPM)
HFNC	FiO₂ (%)	Flow (LPM)	-
Resuscitation	Pressure (cmH₂O)	FiO₂ (%)	-




🔧 Dependencies (From package.json)
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-scripts": "5.0.1",
  "socket.io-client": "^4.8.3",
  "recharts": "^3.7.0",
  "chart.js": "^4.5.1",
  "react-chartjs-2": "^5.3.1",
  "lucide-react": "^0.461.0",
  "tailwindcss": "^3.4.15"
}
