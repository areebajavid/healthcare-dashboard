import React from 'react';
import { Home, Activity, ShieldCheck, Terminal, Sliders, FileText, RotateCw } from 'lucide-react';

// Added props: activeTab and setActiveTab
const Navigation = ({ activeTab, setActiveTab }) => {
    
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="p-[18px]">
            <nav className="w-[100%] bg-white rounded-[70px] flex items-center justify-between px-6 py-2 shadow-sm">
                
                {/* Brand Logo Section */}
                <div className="flex items-center space-x-8">
                    <div className="flex items-center">
                        <div className="flex items-center justify-center ml-4">
                            <span className="text-3xl font-[900] tracking-tighter flex items-center">
                                <span style={{ color: '#012B55' }}>InnAccel</span>
                                <span className="ml-0.5 w-1.5 h-1.5 bg-[#01F0D0] rounded-full"></span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Links - Now Clickable */}
                <div className="flex items-center space-x-2">
                    <NavItem 
                        icon={<Home size={20} />} 
                        label="Fleet Status" 
                        active={activeTab === 'Fleet Status'} 
                        onClick={() => setActiveTab('Fleet Status')}
                    />
                    <NavItem 
                        icon={<Activity size={20} />} 
                        label="Live Sessions" 
                        active={activeTab === 'Live Sessions'} 
                        onClick={() => setActiveTab('Live Sessions')}
                    />
                    <NavItem 
                        icon={<ShieldCheck size={20} />} 
                        label="Calibration" 
                        active={activeTab === 'Calibration'} 
                        onClick={() => setActiveTab('Calibration')}
                    />
                    <NavItem 
                        icon={<Terminal size={20} />} 
                        label="Raw Logs" 
                        active={activeTab === 'Raw Logs'} 
                        onClick={() => setActiveTab('Raw Logs')}
                    />
                </div>

                {/* Actions Section */}
                <div className="flex items-center pr-4">
                    <div className='flex items-center'>
                        <button 
                            onClick={handleRefresh}
                            className="flex items-center space-x-2 px-5 py-2 rounded-full border-2 transition-all hover:bg-gray-50 active:scale-95"
                            style={{ borderColor: '#012B55', color: '#012B55' }}
                        >
                            <RotateCw size={18} className="font-bold" />
                            <span className="font-bold text-sm uppercase tracking-wide">Sync Device</span>
                        </button>
                    </div>

                    <div className="border-r h-8 border-gray-200 mx-3"></div>
                    
                    <div className="flex space-x-1">
                        <button 
                            title="System Configuration" 
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors" 
                            style={{ color: '#012B55' }}
                        >
                            <Sliders size={20} />
                        </button>
                        
                        <button 
                            title="Generate Clinical Report" 
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors" 
                            style={{ color: '#012B55' }}
                        >
                            <FileText size={20} />
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

// Updated NavItem to receive and use onClick
const NavItem = ({ icon, label, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                active 
                ? 'bg-[#01F0D0] text-[#012B55]' 
                : 'hover:bg-gray-100 text-[#012B55] opacity-70'
            }`}
        >
            {icon}
            <span className='font-bold text-sm'>{label}</span>
        </button>
    );
};

export default Navigation;

