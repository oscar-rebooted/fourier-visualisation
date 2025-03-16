import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js';

const Visualisation = () => {
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const freqChartRef = useRef<HTMLCanvasElement | null>(null);
  const timeChartRef = useRef<HTMLCanvasElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const frequencies = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

  useEffect(() => {
    // Set default amplitudes
    const initialAmplitudes = frequencies.map((freq) => {
      if (freq === 1) return 1;
      if (freq === 3) return 0.33;
      if (freq === 5) return 0.2;
      return 0;
    });
    setAmplitudes(initialAmplitudes);

    // Setup frequency domain chart
    const freqCtx = freqChartRef.current?.getContext('2d');
    const freqChart = new Chart(freqCtx!, {
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

    // Setup time domain chart
    const timeCtx = timeChartRef.current?.getContext('2d');
    const timeChart = new Chart(timeCtx!, {
      type: 'line',
      data: {
        datasets: [{
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
          y: { min: -3, max: 3, title: { display: true, text: 'Amplitude' } },
          x: {
            type: 'linear',
            title: { display: true, text: 'Time' },
            min: 0,
            max: 4 * Math.PI,
            ticks: { callback: (value: number) => value.toFixed(1) }
          }
        },
        animation: { duration: 0 }
      }
    });

    // Generate time domain data
    const updateTimeData = () => {
      const points = 400;
      const timeData: number[] = [];
      const labels: number[] = [];
      
      for (let i = 0; i < points; i++) {
        const t = (i / (points - 1)) * 4 * Math.PI;
        let signal = 0;
        frequencies.forEach((freq, j) => {
          signal += initialAmplitudes[j] * Math.sin(freq * t);
        });
        timeData.push(signal);
        labels.push(t);
      }

      timeChart.data.labels = labels;
      timeChart.data.datasets[0].data = timeData;
      timeChart.update();
    };

    updateTimeData();

    // Context menu setup
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const element = freqChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
      if (element.length > 0) {
        // Handle right-click on frequency chart (similar logic as original)
      }
    };

    // Event listeners for canvas interactions
    const canvas = freqChartRef.current;
    if (canvas) {
      canvas.addEventListener('contextmenu', handleContextMenu);
      canvas.addEventListener('click', (e) => {
        // Handle click on the frequency chart (similar logic as original)
      });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [amplitudes]);

  return (
    <div className="container">
      <h1>Fourier Transform Visualization</h1>

      <h2>Time Domain</h2>
      <div className="chart-container">
        <canvas ref={timeChartRef}></canvas>
      </div>

      <h2>Frequency Domain</h2>
      <div className="chart-container">
        <canvas ref={freqChartRef}></canvas>
      </div>
      
      <p className="instructions">
        Click to set amplitude at that frequency. Right-click to delete a frequency component.
      </p>

      <div ref={contextMenuRef} id="contextMenu">
        <div id="deleteFreq">Delete frequency component</div>
      </div>
    </div>
  );
};

export default Visualisation;
