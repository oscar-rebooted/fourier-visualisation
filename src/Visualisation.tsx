import React, { useEffect, useRef, useState } from 'react';
import { 
  Chart, 
  LinearScale, 
  CategoryScale, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  LineElement, 
  PointElement, 
  BarController,
  LineController
} from 'chart.js';

// Register necessary components
Chart.register(
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController
);

const Visualisation = () => {
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const freqChartRef = useRef<HTMLCanvasElement | null>(null);
  const timeChartRef = useRef<HTMLCanvasElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const freqChartInstanceRef = useRef<Chart | null>(null);
  const timeChartInstanceRef = useRef<Chart | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rightClickedFreqIndex, setRightClickedFreqIndex] = useState(-1);

  const frequencies = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

  useEffect(() => {
    // Initialize amplitudes
    const initialAmplitudes = frequencies.map((freq) => {
      if (freq === 1) return 1;
      if (freq === 3) return 0.33;
      if (freq === 5) return 0.2;
      return 0;
    });
    setAmplitudes(initialAmplitudes);

    // Destroy previous charts
    if (freqChartInstanceRef.current) {
      freqChartInstanceRef.current.destroy();
      freqChartInstanceRef.current = null;
    }
    if (timeChartInstanceRef.current) {
      timeChartInstanceRef.current.destroy();
      timeChartInstanceRef.current = null;
    }

    // Setup frequency domain chart
    const freqCtx = freqChartRef.current?.getContext('2d');
    if (freqCtx && freqChartRef.current) {
      freqChartInstanceRef.current = new Chart(freqCtx, {
        type: 'bar',
        data: {
          labels: frequencies,
          datasets: [{
            data: initialAmplitudes,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 1.2,
              title: { display: true, text: 'Amplitude' }
            },
            x: { title: { display: true, text: 'Frequency (Hz)' } }
          },
          animation: { duration: 0 }
        }
      });
    }

    // Setup time domain chart
    const timeCtx = timeChartRef.current?.getContext('2d');
    if (timeCtx && timeChartRef.current) {
      timeChartInstanceRef.current = new Chart(timeCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { 
              min: -3, 
              max: 3, 
              title: { display: true, text: 'Amplitude' } 
            },
            x: {
              type: 'linear',
              title: { display: true, text: 'Time (seconds)' },
              min: 0,
              max: 2, // Show 2 seconds of time
              ticks: {
                callback: function(value: any) {
                  return value.toFixed(2);
                }
              }
            }
          },
          animation: { duration: 0 }
        }
      });

      // Initial data update
      updateTimeData(initialAmplitudes);
    }

    return () => {
      if (freqChartInstanceRef.current) {
        freqChartInstanceRef.current.destroy();
      }
      if (timeChartInstanceRef.current) {
        timeChartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Function to update time domain data with fixed frequency representation
  const updateTimeData = (currentAmplitudes: number[]) => {
    const points = 400;
    const timeData: number[] = [];
    const labels: number[] = [];
    
    for (let i = 0; i < points; i++) {
      // Map to 0-2 seconds time range
      const t = (i / (points - 1)) * 2; // 2 seconds of data
      let signal = 0;
      
      // Sum all frequency components with correct frequency
      frequencies.forEach((freq, j) => {
        // Use 2π*f*t for correct frequency in Hz
        signal += currentAmplitudes[j] * Math.sin(2 * Math.PI * freq * t);
      });
      
      timeData.push(signal);
      labels.push(t);
    }
    
    if (timeChartInstanceRef.current) {
      timeChartInstanceRef.current.data.labels = labels;
      timeChartInstanceRef.current.data.datasets[0].data = timeData;
      timeChartInstanceRef.current.update();
    }
  };

  // Update the charts when amplitudes change
  useEffect(() => {
    if (freqChartInstanceRef.current && amplitudes.length > 0) {
      freqChartInstanceRef.current.data.datasets[0].data = amplitudes;
      freqChartInstanceRef.current.update();
      updateTimeData(amplitudes);
    }
  }, [amplitudes]);

  // Function to update frequency at a specific point with fixed position calculation
  const updateFrequencyAtPoint = (x: number, y: number) => {
    if (!freqChartInstanceRef.current || !freqChartRef.current) return;
    
    const chartArea = freqChartInstanceRef.current.chartArea;
    
    // Ensure point is within chart area
    if (x < chartArea.left || x > chartArea.right || 
        y < chartArea.top || y > chartArea.bottom) {
      return;
    }
    
    // Calculate which frequency corresponds to this x position
    const xRatio = (x - chartArea.left) / (chartArea.right - chartArea.left);
    const freqIndex = Math.round(xRatio * (frequencies.length - 1));
    
    // Calculate amplitude based on y position - improved calculation
    const amplitude = 1 - ((y - chartArea.top) / (chartArea.bottom - chartArea.top));
    const clampedAmplitude = Math.max(0, Math.min(1, amplitude)); // Clamp between 0 and 1
    
    // Update amplitudes
    const newAmplitudes = [...amplitudes];
    newAmplitudes[freqIndex] = clampedAmplitude;
    setAmplitudes(newAmplitudes);
  };

  // Handle context menu (right click)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!freqChartInstanceRef.current) return;
    
    const element = freqChartInstanceRef.current.getElementsAtEventForMode(
      e.nativeEvent, 
      'nearest', 
      { intersect: true }, 
      false
    );
    
    if (element.length > 0) {
      const freqIndex = element[0].index;
      setRightClickedFreqIndex(freqIndex);
      
      // Only show context menu if there's an amplitude to delete
      if (amplitudes[freqIndex] > 0) {
        // Position and show context menu
        if (contextMenuRef.current) {
          contextMenuRef.current.style.left = `${e.pageX}px`;
          contextMenuRef.current.style.top = `${e.pageY}px`;
          contextMenuRef.current.style.display = 'block';
        }
      }
    }
  };

  // Handle click on frequency chart
  const handleClick = (e: React.MouseEvent) => {
    if (!freqChartRef.current || !freqChartInstanceRef.current) return;
    
    const rect = freqChartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    updateFrequencyAtPoint(x, y);
  };

  // Handle mouse down on frequency chart
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only respond to left clicks
    
    if (!freqChartRef.current || !freqChartInstanceRef.current) return;
    
    const rect = freqChartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    
    // Set initial point
    updateFrequencyAtPoint(x, y);
  };

  // Handle mouse move on frequency chart
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    if (!freqChartRef.current) return;
    
    const rect = freqChartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update frequency at current position
    updateFrequencyAtPoint(x, y);
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave to stop dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle delete frequency
  const handleDeleteFreq = () => {
    if (rightClickedFreqIndex !== -1) {
      const newAmplitudes = [...amplitudes];
      newAmplitudes[rightClickedFreqIndex] = 0;
      setAmplitudes(newAmplitudes);
      
      if (contextMenuRef.current) {
        contextMenuRef.current.style.display = 'none';
      }
    }
  };

  // Hide context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuRef.current) {
        contextMenuRef.current.style.display = 'none';
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="container">
      <h1>Fourier Transform Visualization</h1>
      
      <div className="instructions-panel">
        <p className="instructions">
          <strong>How to use:</strong> The bottom chart shows frequency components, and the top chart shows 
          the resulting wave. <strong>Click or drag</strong> on the frequency chart to set amplitude values. 
          <strong>Right-click</strong> on a frequency bar to remove that component.
        </p>
      </div>

      <h2>Time Domain</h2>
      <div className="chart-container">
        <canvas ref={timeChartRef}></canvas>
      </div>

      <h2>Frequency Domain</h2>
      <div className="chart-container interactive-chart">
        <canvas 
          ref={freqChartRef} 
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
        ></canvas>
      </div>

      <div 
        ref={contextMenuRef} 
        id="contextMenu" 
        style={{
          display: 'none',
          position: 'absolute',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '5px',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        <div 
          id="deleteFreq" 
          onClick={handleDeleteFreq}
          style={{
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          Delete frequency component
        </div>
      </div>
      
      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        .chart-container {
          position: relative;
          height: 300px;
          margin-bottom: 30px;
        }
        .interactive-chart canvas {
          cursor: pointer;
        }
        .instructions-panel {
          background-color: #f8f9fa;
          border-left: 4px solid #6c757d;
          padding: 10px 15px;
          margin-bottom: 20px;
        }
        .instructions {
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default Visualisation;