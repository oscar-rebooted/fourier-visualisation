import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Label, ReferenceLine } from 'recharts';

const FourierTransformVisualization = () => {
  // Generate initial frequency domain data
  const generateInitialFrequencyData = () => {
    const freqData = [];
    for (let f = 0; f <= 10; f += 0.5) {
      // Add some initial frequencies
      let amplitude = 0;
      if (f === 1) amplitude = 1;
      if (f === 3) amplitude = 0.33;
      if (f === 5) amplitude = 0.2;
      
      freqData.push({
        frequency: f,
        amplitude: amplitude
      });
    }
    return freqData;
  };

  const [freqData, setFreqData] = useState(generateInitialFrequencyData());
  const [timeData, setTimeData] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [activeFrequency, setActiveFrequency] = useState(null);

  // Generate time domain signal based on frequency data
  useEffect(() => {
    const points = 500;
    const newTimeData = [];
    
    for (let i = 0; i < points; i++) {
      const t = (i / points) * 4 * Math.PI;
      let signal = 0;
      
      // Sum all frequency components
      freqData.forEach(freq => {
        signal += freq.amplitude * Math.sin(freq.frequency * t);
      });
      
      newTimeData.push({
        time: t,
        amplitude: signal
      });
    }
    
    setTimeData(newTimeData);
  }, [freqData]);

  // Handle dragging on frequency domain
  const handleMouseDown = (e) => {
    if (!e) return;
    setDragging(true);
    
    const svg = e.target.closest('svg');
    if (!svg) return;
    
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    
    // Find the closest frequency point
    const chartArea = svg.getBoundingClientRect();
    const xScale = 10 / chartArea.width;
    const freq = svgPoint.x * xScale;
    
    setActiveFrequency(Math.round(freq * 2) / 2); // Round to nearest 0.5
    
    // Update immediately
    handleMouseMove(e);
  };

  const handleMouseMove = (e) => {
    if (!dragging || activeFrequency === null || !e) return;
    
    const svg = e.target.closest('svg');
    if (!svg) return;
    
    const chartArea = svg.getBoundingClientRect();
    const svgHeight = chartArea.height;
    const boundingRect = svg.getBoundingClientRect();
    
    // Calculate normalized amplitude (0 to 1)
    const mouseY = e.clientY - boundingRect.top;
    const amplitude = Math.max(0, Math.min(1, 1 - (mouseY / svgHeight)));
    
    // Update frequency data
    setFreqData(freqData.map(point => 
      Math.abs(point.frequency - activeFrequency) < 0.01 
        ? { ...point, amplitude } 
        : point
    ));
  };

  const handleMouseUp = () => {
    setDragging(false);
    setActiveFrequency(null);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Fourier Transform Visualization</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Time Domain</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time">
                <Label value="Time" position="bottom" offset={0} />
              </XAxis>
              <YAxis domain={[-3, 3]}>
                <Label value="Amplitude" position="left" angle={-90} />
              </YAxis>
              <Line type="monotone" dataKey="amplitude" stroke="#8884d8" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Frequency Domain (Drag points up/down)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={freqData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="frequency">
                <Label value="Frequency" position="bottom" offset={0} />
              </XAxis>
              <YAxis domain={[0, 1.2]}>
                <Label value="Amplitude" position="left" angle={-90} />
              </YAxis>
              <Line 
                type="monotone" 
                dataKey="amplitude" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#82ca9d" }}
                activeDot={{ r: 8, fill: "#4CAF50" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FourierTransformVisualization;