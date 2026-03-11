import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, FileText, Plus, Activity } from 'lucide-react';
import PatientList from './components/PatientList'; 
import SessionMetricsChart from './components/SessionMetricsChart';
import { getGraphData } from './utils/logParser';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function App() {
  // Existing state
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [activeFileIndex, setActiveFileIndex] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null); 
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({ sessionId: '', pcId: '' });

  // Live session state
  const [activeTab, setActiveTab] = useState('history');
  const [liveData, setLiveData] = useState(null);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  // Live chart state
  const [liveChartData, setLiveChartData] = useState([]);
  const sessionStartTime = useRef(null);
  const maxDataPoints = 300;

  const currentFile = activeFileIndex !== null ? uploadedFiles[activeFileIndex] : null;
  const currentSessions = currentFile ? currentFile.sessions : [];

  const filteredSessions = currentSessions.filter(s => {
    if (isSearchOpen && (searchParams.sessionId || searchParams.pcId)) {
      const matchSid = searchParams.sessionId ? s.session_id.toString() === searchParams.sessionId : true;
      const matchPcid = searchParams.pcId ? s.power_cycle_id.toString() === searchParams.pcId : true;
      return matchSid && matchPcid;
    }
    if (filterStatus !== null) return s.overall_pass === (filterStatus === 'True');
    if (selectedMode !== null) return s.mode === selectedMode;
    return true; 
  });

  useEffect(() => {
    if (selectedSession && currentFile) {
      const data = getGraphData(
        currentFile.rawText, 
        selectedSession.power_cycle_id, 
        selectedSession.session_id
      );
      setChartData(data);
    }
  }, [selectedSession, activeFileIndex, uploadedFiles, currentFile]);

  // Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✓ Connected to backend server');
    });

    newSocket.on('updateDashboard', (data) => {
      console.log('📊 Received live data:', data);
      
      setLiveData(data);
      setIsDeviceConnected(true);

      if (!sessionStartTime.current) {
        sessionStartTime.current = Date.now();
        console.log('🕐 Session started');
      }

      const elapsedTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      const calculatedPressure = data.actualPressure || 
        ((data.actualPressureHigh * 256 + data.actualPressureLow) / 10);

      const newDataPoint = {
        time: elapsedTime,
        flow: Number(data.actualFlow) || 0,
        fio2: Number(data.actualFiO2) || 0,
        pressure: Number(calculatedPressure.toFixed(1)) || 0
      };

      console.log('📈 Adding data point:', newDataPoint);

      setLiveChartData(prevData => {
        const updatedData = [...prevData, newDataPoint];
        if (updatedData.length > maxDataPoints) {
          return updatedData.slice(updatedData.length - maxDataPoints);
        }
        return updatedData;
      });
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Disconnected from backend server');
      setIsDeviceConnected(false);
      sessionStartTime.current = null;
      setLiveChartData([]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'live') {
      sessionStartTime.current = null;
      setLiveChartData([]);
      console.log('🔄 Live chart reset');
    }
  }, [activeTab]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.log')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawText = e.target.result;
      
      const formData = new FormData();
      formData.append('logFile', file);

      try {
        const response = await fetch('http://localhost:5000/api/upload-log', { 
            method: 'POST', 
            body: formData 
        });
        const data = await response.json();
        
        if (data.success) {
            const newFileEntry = {
                name: file.name,
                rawText: rawText,
                sessions: data.sessions
            };
            setUploadedFiles(prev => [...prev, newFileEntry]);
            setActiveFileIndex(uploadedFiles.length);
            setSelectedSession(null);
            setActiveTab('history');
        }
      } catch (err) { console.error(err); }
    };
    reader.readAsText(file);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) { setSelectedMode(null); setFilterStatus(null); }
  };

  // ========== NEW: Mode-aware chart configuration ==========
  const getChartConfig = (mode) => {
    switch(mode) {
      case 'nCPAP':
        return {
          lines: [
            { key: 'pressure', name: 'Pressure', color: '#10b981', yAxisId: 'pressure' },
            { key: 'fio2', name: 'FiO₂', color: '#8b5cf6', yAxisId: 'fio2' }
          ],
          axes: [
            { id: 'pressure', label: 'Pressure (cmH₂O)', color: '#10b981', orientation: 'left', domain: ['dataMin - 1', 'dataMax + 1'] },
            { id: 'fio2', label: 'FiO₂ (%)', color: '#8b5cf6', orientation: 'right', domain: ['dataMin - 5', 'dataMax + 5'] }
          ],
          title: 'nCPAP - Pressure & FiO₂ Monitoring'
        };
      
      case 'Bubble CPAP':
        return {
          lines: [
            { key: 'pressure', name: 'Pressure', color: '#10b981', yAxisId: 'pressure' },
            { key: 'fio2', name: 'FiO₂', color: '#8b5cf6', yAxisId: 'fio2' },
            { key: 'flow', name: 'Flow', color: '#3b82f6', yAxisId: 'flow' }
          ],
          axes: [
            { id: 'pressure', label: 'Pressure (cmH₂O)', color: '#10b981', orientation: 'left', domain: ['dataMin - 1', 'dataMax + 1'] },
            { id: 'fio2', label: 'FiO₂ (%)', color: '#8b5cf6', orientation: 'right', domain: ['dataMin - 5', 'dataMax + 5'] },
            { id: 'flow', label: 'Flow (LPM)', color: '#3b82f6', orientation: 'right', domain: ['dataMin - 1', 'dataMax + 1'], width: 80 }
          ],
          title: 'Bubble CPAP - Pressure, FiO₂ & Flow Monitoring'
        };
      
      case 'HFNC':
        return {
          lines: [
            { key: 'fio2', name: 'FiO₂', color: '#8b5cf6', yAxisId: 'fio2' },
            { key: 'flow', name: 'Flow', color: '#3b82f6', yAxisId: 'flow' }
          ],
          axes: [
            { id: 'fio2', label: 'FiO₂ (%)', color: '#8b5cf6', orientation: 'left', domain: ['dataMin - 5', 'dataMax + 5'] },
            { id: 'flow', label: 'Flow (LPM)', color: '#3b82f6', orientation: 'right', domain: ['dataMin - 1', 'dataMax + 1'] }
          ],
          title: 'HFNC - FiO₂ & Flow Monitoring'
        };
      
      case 'Resuscitation':
        return {
          lines: [
            { key: 'pressure', name: 'Pressure', color: '#10b981', yAxisId: 'pressure' },
            { key: 'fio2', name: 'FiO₂', color: '#8b5cf6', yAxisId: 'fio2' }
          ],
          axes: [
            { id: 'pressure', label: 'Pressure (cmH₂O)', color: '#10b981', orientation: 'left', domain: ['dataMin - 1', 'dataMax + 1'] },
            { id: 'fio2', label: 'FiO₂ (%)', color: '#8b5cf6', orientation: 'right', domain: ['dataMin - 5', 'dataMax + 5'] }
          ],
          title: 'RESUS - Pressure & FiO₂ Monitoring'
        };
      
      default:
        return {
          lines: [
            { key: 'pressure', name: 'Pressure', color: '#10b981', yAxisId: 'pressure' },
            { key: 'fio2', name: 'FiO₂', color: '#8b5cf6', yAxisId: 'fio2' },
            { key: 'flow', name: 'Flow', color: '#3b82f6', yAxisId: 'flow' }
          ],
          axes: [
            { id: 'pressure', label: 'Pressure (cmH₂O)', color: '#10b981', orientation: 'left', domain: ['dataMin - 1', 'dataMax + 1'] },
            { id: 'fio2', label: 'FiO₂ (%)', color: '#8b5cf6', orientation: 'right', domain: ['dataMin - 5', 'dataMax + 5'] },
            { id: 'flow', label: 'Flow (LPM)', color: '#3b82f6', orientation: 'right', domain: ['dataMin - 1', 'dataMax + 1'], width: 80 }
          ],
          title: 'Live Monitoring'
        };
    }
  };

  const chartConfig = liveData ? getChartConfig(liveData.mode) : getChartConfig('default');
  // =========================================================

  return (
    <div className='bg-gray-50 h-screen flex flex-col overflow-hidden font-sans'>
      {/* HEADER SECTION */}
      <header className="bg-white px-8 py-4 flex items-center justify-between border-b z-50 shadow-sm">
        <div className="w-[40%] flex items-center gap-3">
          <div className="relative">
            <button onClick={() => { setIsModeOpen(!isModeOpen); setIsSearchOpen(false); }} className="flex items-center gap-2 px-4 py-2 bg-[#012B55] text-white rounded font-bold text-sm">
              MODE <ChevronDown size={16} />
            </button>
            {isModeOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border shadow-2xl rounded-lg overflow-hidden z-[60]">
                {["HFNC", "Bubble CPAP", "nCPAP"].map((mode) => (
                  <div key={mode} onClick={() => { setSelectedMode(mode); setFilterStatus(null); setIsModeOpen(false); setSelectedSession(null); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-[#012B55] font-bold border-b last:border-0">
                    {mode}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setFilterStatus('True'); setSelectedMode(null); setSelectedSession(null); }} className={`px-4 py-2 rounded font-bold text-sm border-2 ${filterStatus === 'True' ? 'bg-green-600 border-green-600 text-white' : 'border-green-600 text-green-600'}`}>PASSED</button>
          <button onClick={() => { setFilterStatus('False'); setSelectedMode(null); setSelectedSession(null); }} className={`px-4 py-2 rounded font-bold text-sm border-2 ${filterStatus === 'False' ? 'bg-red-600 border-red-600 text-white' : 'border-red-600 text-red-600'}`}>FAILED</button>
          <button onClick={toggleSearch} className={`p-2 rounded-full ${isSearchOpen ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{isSearchOpen ? <X size={18} /> : <Search size={18} />}</button>
          {isSearchOpen && (
            <div className="flex gap-2">
              <input type="text" placeholder="SID" className="w-12 px-2 py-1 border rounded text-xs font-bold" onChange={(e) => setSearchParams({ ...searchParams, sessionId: e.target.value })} />
              <input type="text" placeholder="PCID" className="w-12 px-2 py-1 border rounded text-xs font-bold" onChange={(e) => setSearchParams({ ...searchParams, pcId: e.target.value })} />
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-2xl font-[1000] text-[#012B55]">SAANS DASHBOARD</h1>
          <p className="text-[10px] font-black text-cyan-600 tracking-[0.2em] uppercase">
            {activeTab === 'live' ? 'LIVE SESSION' : (currentFile ? currentFile.name : 'No Log Active')}
          </p>
        </div>

        <div className="w-[30%] flex justify-end">
          <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-full font-black text-xs flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Plus size={16} /> UPLOAD NEW LOG
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className='w-1/5 h-full bg-[#E0F2FE] flex flex-col border-r border-blue-100'>
          {/* Tab Switcher */}
          <div className="p-3 flex gap-2 bg-[#d1e9fa]">
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-blue-400 hover:bg-blue-200'
              }`}
            >
              <FileText size={14} />
              <span>HISTORY</span>
            </button>
            <button 
              onClick={() => setActiveTab('live')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'live' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-blue-400 hover:bg-blue-200'
              }`}
            >
              <Activity size={14} />
              <span>LIVE</span>
              {isDeviceConnected && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>

          {/* History mode content */}
          {activeTab === 'history' && (
            <>
              <div className="p-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-blue-800 ml-1">FILES</span>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {uploadedFiles.map((file, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => { setActiveFileIndex(idx); setSelectedSession(null); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeFileIndex === idx 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-blue-400 hover:bg-blue-200'
                      }`}
                    >
                      <FileText size={14} />
                      <span className="truncate w-full text-left">{file.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <PatientList 
                  sessions={filteredSessions} 
                  selectedSession={selectedSession} 
                  onSelectSession={setSelectedSession} 
                />
              </div>
            </>
          )}

          {/* Live mode sidebar with metrics */}
          {activeTab === 'live' && (
            <div className="flex-1 flex flex-col">
              {isDeviceConnected && liveData ? (
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {/* Connection Status */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-green-700">DEVICE CONNECTED</span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {new Date(liveData.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Mode */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-xs font-bold opacity-90 mb-1">MODE</p>
                    <p className="text-2xl font-black">{liveData.mode}</p>
                  </div>

                  {/* ========== NEW: Mode-aware sidebar - ONLY SET VALUES ========== */}
                  
                  {/* nCPAP Mode: Show Set Pressure and Set FiO2 */}
                  {liveData.mode === 'nCPAP' && (
                    <>
                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
                        <p className="text-xs font-bold text-green-600 mb-1">SET PRESSURE</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-green-900">
                            {((liveData.setPressureHigh * 256 + liveData.setPressureLow) / 10).toFixed(1)}
                          </span>
                          <span className="text-sm font-bold text-green-600">cmH₂O</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
                        <p className="text-xs font-bold text-purple-600 mb-1">SET FiO₂</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-purple-900">{liveData.setFiO2}</span>
                          <span className="text-sm font-bold text-purple-600">%</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Bubble CPAP Mode: Show Set Flow and Set FiO2 */}
                  {liveData.mode === 'Bubble CPAP' && (
                    <>
                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
                        <p className="text-xs font-bold text-blue-600 mb-1">SET FLOW</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-blue-900">{liveData.setFlow}</span>
                          <span className="text-sm font-bold text-blue-600">LPM</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
                        <p className="text-xs font-bold text-purple-600 mb-1">SET FiO₂</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-purple-900">{liveData.setFiO2}</span>
                          <span className="text-sm font-bold text-purple-600">%</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* HFNC Mode: Show Set Flow and Set FiO2 */}
                  {liveData.mode === 'HFNC' && (
                    <>
                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
                        <p className="text-xs font-bold text-blue-600 mb-1">SET FLOW</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-blue-900">{liveData.setFlow}</span>
                          <span className="text-sm font-bold text-blue-600">LPM</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
                        <p className="text-xs font-bold text-purple-600 mb-1">SET FiO₂</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-purple-900">{liveData.setFiO2}</span>
                          <span className="text-sm font-bold text-purple-600">%</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Resuscitation Mode: Show Set PEEP, Set PIP, and Set FiO2 */}
                  {liveData.mode === 'Resuscitation' && (
                    <>
                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
                        <p className="text-xs font-bold text-green-600 mb-1">SET PEEP</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-green-900">{liveData.setPEEP}</span>
                          <span className="text-sm font-bold text-green-600">cmH₂O</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
                        <p className="text-xs font-bold text-orange-600 mb-1">SET PIP</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-orange-900">{liveData.setPIP}</span>
                          <span className="text-sm font-bold text-orange-600">cmH₂O</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
                        <p className="text-xs font-bold text-purple-600 mb-1">SET FiO₂</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-purple-900">{liveData.setFiO2}</span>
                          <span className="text-sm font-bold text-purple-600">%</span>
                        </div>
                      </div>
                    </>
                  )}
                  {/* ================================================================ */}

                  {/* Alert (if any) */}
                  {liveData.alertText && liveData.alertText !== 'No Alert' && (
                    <div className="bg-yellow-50 rounded-xl p-4 border-l-4 border-yellow-500">
                      <p className="text-xs font-bold text-yellow-700">⚠ ALERT</p>
                      <p className="text-sm font-bold text-yellow-900 mt-1">{liveData.alertText}</p>
                    </div>
                  )}

                  {/* Data Points Counter */}
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-500 font-bold">DATA POINTS</p>
                    <p className="text-xl font-black text-gray-700">{liveChartData.length}</p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      {liveChartData.length > 0 ? `${liveChartData[liveChartData.length - 1].time}s elapsed` : 'Waiting...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                  <Activity size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold text-sm mb-2">Waiting for Device</p>
                  <p className="text-gray-400 text-xs">Connect Android app to see live data</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MAIN VIEW */}
        <div className="flex-1 p-8 flex flex-col bg-slate-50">
          {/* HISTORY TAB */}
          {activeTab === 'history' && selectedSession && (
            <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col animate-in fade-in zoom-in duration-300">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-[#012B55]">
                  ID: {selectedSession.session_id} <span className="text-gray-300 mx-2">|</span> PC: {selectedSession.power_cycle_id}
                </h2>
              </div>
              <div className="flex-1 min-h-0 mt-4">
                <SessionMetricsChart data={chartData} />
              </div>
            </div>
          )}

          {activeTab === 'history' && !selectedSession && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-4 border-dashed border-gray-200 rounded-3xl">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-lg">Select a Session</p>
              <p className="text-sm">Click on a session from the list to view high-res data</p>
            </div>
          )}

          {/* ========== LIVE TAB with mode-aware chart ========== */}
          {activeTab === 'live' && (
            <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm animate-in fade-in zoom-in duration-300">
              {isDeviceConnected && liveData ? (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-[#012B55] flex items-center gap-3">
                          {chartConfig.title}
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            LIVE
                          </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {liveData.mode} • {liveChartData.length} data points
                        </p>
                      </div>
                      
                      {/* ========== NEW: Prominent Alert Display ========== */}
                      {liveData.alertText && liveData.alertText !== 'No Alert' && (
                        <div className="flex items-center gap-3 px-6 py-3 bg-red-50 border-2 border-red-500 rounded-xl animate-pulse">
                          <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full">
                            <span className="text-white text-2xl font-bold">⚠</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-red-600 uppercase">ALERT</p>
                            <p className="text-lg font-black text-red-700">{liveData.alertText}</p>
                          </div>
                        </div>
                      )}
                      {/* ================================================== */}
                    </div>
                  </div>

                  {/* Mode-aware Live Chart */}
                  <div className="flex-1 min-h-0">
                    {liveChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={liveChartData} 
                          margin={{ top: 10, right: chartConfig.axes.length > 2 ? 100 : 60, left: 10, bottom: 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          
                          <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            label={{ 
                              value: 'Time (seconds)', 
                              position: 'insideBottom', 
                              offset: -10,
                              style: { fill: '#012B55', fontWeight: 'bold', fontSize: 13 }
                            }}
                          />
                          
                          {/* Dynamic Y-axes based on mode */}
                          {chartConfig.axes.map((axis, index) => (
                            <YAxis 
                              key={axis.id}
                              yAxisId={axis.id}
                              orientation={axis.orientation}
                              domain={axis.domain}
                              tick={{ fontSize: 11, fill: axis.color }}
                              width={axis.width || 60}
                              label={{ 
                                value: axis.label, 
                                angle: axis.orientation === 'left' ? -90 : 90, 
                                position: axis.orientation === 'left' ? 'insideLeft' : 'insideRight',
                                offset: index > 1 ? 20 : 0,
                                style: { fill: axis.color, fontWeight: 'bold', fontSize: 12 }
                              }}
                            />
                          ))}
                          
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              fontSize: '12px'
                            }}
                            formatter={(value, name) => {
                              if (name === 'Flow') return [value + ' LPM', 'Flow'];
                              if (name === 'FiO₂') return [value + ' %', 'FiO₂'];
                              if (name === 'Pressure') return [value + ' cmH₂O', 'Pressure'];
                              return [value, name];
                            }}
                          />
                          
                          <Legend 
                            verticalAlign="top" 
                            height={40}
                            wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          />
                          
                          {/* Dynamic lines based on mode */}
                          {chartConfig.lines.map(line => (
                            <Line 
                              key={line.key}
                              yAxisId={line.yAxisId}
                              type="monotone"
                              dataKey={line.key}
                              stroke={line.color}
                              name={line.name}
                              dot={false}
                              strokeWidth={2.5}
                              isAnimationActive={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Activity size={48} className="mx-auto mb-4 opacity-20 animate-pulse" />
                          <p className="font-bold">Collecting data...</p>
                          <p className="text-sm mt-2">Chart will appear as data arrives</p>
                          <p className="text-xs mt-2 text-gray-300">Change device values to see the graph update</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Activity size={64} className="mb-4 opacity-20" />
                  <p className="font-bold text-xl mb-2">Waiting for Live Data</p>
                  <p className="text-sm">Connect your Android app to the medical device</p>
                  <p className="text-xs mt-4 text-gray-300">Make sure both devices are on the same network</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
