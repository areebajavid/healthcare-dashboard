import express from 'express';
import { createServer } from 'http'; // Added for real-time support
import { Server } from 'socket.io'; // Added for real-time support
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import { generateSessionReport } from './utils/logParser.js';

const app = express();
app.use(cors());

// 1. Create the HTTP server and initialize Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allows your React dashboard to connect
    methods: ["GET", "POST"]
  }
});

const upload = multer({ dest: 'uploads/' });

// --- Existing Log File Logic (No changes made here) ---
app.post('/api/upload-log', upload.single('logFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const logContent = fs.readFileSync(req.file.path, 'utf8');
    const sessions = generateSessionReport(logContent);
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      sessions: sessions 
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- New Real-Time Logic for Android App ---
io.on('connection', (socket) => {
  console.log('A device connected:', socket.id);

  // Listen for 'sensorData' from the Android app
  socket.on('sensorData', (data) => {
    // data should look like { flowPressure: 12, fio2: 40 }
    // We immediately broadcast this to the React Frontend
    io.emit('updateDashboard', data);
  });

  socket.on('disconnect', () => {
    console.log('Device disconnected');
  });
});

// 2. Change app.listen to httpServer.listen
httpServer.listen(5000, () => {
  console.log('HEALTHCARE-DASHBOARD Backend running on port 5000 with Real-time Sockets');
});