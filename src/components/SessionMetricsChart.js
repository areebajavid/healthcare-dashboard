import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SessionMetricsChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={data} 
        margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e2e8f0" />
        
        <XAxis 
          dataKey="time" 
          tick={{fontSize: 11, fill: '#64748b'}} 
          minTickGap={20} // Adjusted for high-density data
          label={{ 
            value: 'Therapy Time (s)', 
            position: 'insideBottom', 
            offset: -10,
            style: { fill: '#012B55', fontWeight: 'bold', fontSize: 13 }
          }}
        />
        
        <YAxis 
          yAxisId="left" 
          domain={['auto', 'auto']} // Zoom in on the data range
          tick={{fontSize: 11, fill: '#64748b'}}
          label={{ 
            value: 'FiO2 %', 
            angle: -90, 
            position: 'insideLeft',
            style: { fill: '#012B55', fontWeight: 'bold', fontSize: 13 }
          }} 
        />
        
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          domain={['auto', 'auto']}
          tick={{fontSize: 11, fill: '#64748b'}}
          label={{ 
            value: 'DAC Value', 
            angle: 90, 
            position: 'insideRight',
            style: { fill: '#012B55', fontWeight: 'bold', fontSize: 13 }
          }} 
        />
        
        <Tooltip 
          isAnimationActive={false} // Improves performance with high-density points
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        
        <Legend verticalAlign="top" height={40} />
        
        {/* LINE UPDATES: type="linear" removes the "smoothing" effect */}
        <Line 
          yAxisId="left" 
          type="linear" 
          dataKey="fio2" 
          stroke="#06b6d4" 
          name="Raw FiO2" 
          dot={false} 
          strokeWidth={2}
          isAnimationActive={false} // Performance boost for high-res data
        />
        <Line 
          yAxisId="right" 
          type="linear" 
          dataKey="dac" 
          stroke="#6366f1" 
          name="Raw DAC" 
          dot={false} 
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SessionMetricsChart;