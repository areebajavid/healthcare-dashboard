import React from 'react';

const PatientList = ({ sessions, selectedSession, onSelectSession }) => {
  return (
    <div className="flex flex-col">
      {sessions.map((session) => {
        // UPDATED: Using snake_case keys (session_id, power_cycle_id) to match backend
        const isActive = 
          selectedSession?.session_id === session.session_id && 
          selectedSession?.power_cycle_id === session.power_cycle_id;
        
        return (
          <button
            // UPDATED: key uses power_cycle_id
            key={`${session.power_cycle_id}-${session.session_id}`}
            onClick={() => onSelectSession(session)}
            className={`w-full text-left transition-all duration-200 border-b border-blue-200/50 ${
              isActive 
                ? 'bg-white shadow-sm border-l-4 border-[#012B55] py-6 px-6' 
                : 'bg-transparent py-5 px-6 hover:bg-blue-100/50'
            }`}
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-blue-600' : 'text-blue-400'}`}>
                  PC: {session.power_cycle_id} {/* UPDATED KEY */}
                </span>
                {isActive && <div className="w-2 h-2 rounded-full bg-[#012B55]" />}
              </div>
              
              <h4 className={`text-xl font-black leading-none ${isActive ? 'text-[#012B55]' : 'text-blue-900'}`}>
                ID: {session.session_id} {/* UPDATED KEY */}
              </h4>
              
              <p className={`text-xs font-bold mt-2 ${isActive ? 'text-blue-700' : 'text-blue-500 opacity-80'}`}>
                {session.mode} {/* UPDATED: from therapyMode to mode */}
              </p>
            </div>
          </button>
        );
      })}
      
      {sessions.length === 0 && (
        <div className="p-10 text-center text-blue-400 italic text-sm">
          No records found
        </div>
      )}
    </div>
  );
};

export default PatientList;