import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend, ReferenceLine, Area } from 'recharts';

// Add basic styles
const useGlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
};

const API_BASE_URL = 'http://localhost:8000';

const getStockPrediction = async (ticker, days = 5) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/predict`, {
      params: { ticker: ticker.toUpperCase(), days: days },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Stock ticker "${ticker}" not found or no data available.`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred during prediction. Please try again.');
    } else if (error.request) {
      throw new Error('Unable to connect to the server. Please ensure the backend is running.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
};

const StockChart = ({ data, ticker }) => {
  const chartData = data.map(item => ({
    ...item,
    upperBound: item.confidenceRange ? item.confidenceRange[1] : null,
    lowerBound: item.confidenceRange ? item.confidenceRange[0] : null,
  }));

  const transitionIndex = chartData.findIndex(item => item.actualPrice === null && item.predictedPrice !== null);

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', height: '400px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>{ticker || 'Stock'} Price Analysis</h3>
        <p style={{ color: '#64748b' }}>No data available for chart</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', height: '400px' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>{ticker || 'Stock'} Price Analysis</h3>
      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(value) => `$${value.toFixed(0)}`} />
          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#1E293B' }} formatter={(value, name) => {
            if (value === null) return null;
            if (name === 'actualPrice') return [`$${value.toFixed(2)}`, 'Historical Price'];
            if (name === 'predictedPrice') return [`$${value.toFixed(2)}`, 'Predicted Price'];
            if (name === 'upperBound') return [`$${value.toFixed(2)}`, 'Upper Confidence'];
            if (name === 'lowerBound') return [`$${value.toFixed(2)}`, 'Lower Confidence'];
            return [value, name];
          }} />
          <Legend verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: '12px' }} />
          {transitionIndex > 0 && <ReferenceLine x={chartData[transitionIndex]?.date} stroke="#94A3B8" strokeDasharray="3 3" label={{ value: 'Today', position: 'topLeft', fill: '#64748B', fontSize: 12 }} />}
          <Area type="monotone" dataKey="upperBound" fill="#DBEAFE" stroke="none" opacity={0.3} isAnimationActive={false} />
          <Area type="monotone" dataKey="lowerBound" fill="#FFFFFF" stroke="none" opacity={0.9} isAnimationActive={false} />
          <Line type="monotone" dataKey="actualPrice" stroke="#94A3B8" strokeWidth={2} dot={false} name="Historical Price" connectNulls={false} />
          <Line type="monotone" dataKey="predictedPrice" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} name="Predicted Price" connectNulls={false} />
          <Line type="monotone" dataKey="lowerBound" stroke="#3B82F6" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Lower Confidence" connectNulls={false} opacity={0.6} />
          <Line type="monotone" dataKey="upperBound" stroke="#3B82F6" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Upper Confidence" connectNulls={false} opacity={0.6} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

function App() {
  useGlobalStyles();
  const [ticker, setTicker] = useState('AAPL');
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionData, setPredictionData] = useState(null);

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
    { symbol: 'META', name: 'Meta Platforms, Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
  ];

  const getCompanyName = (symbol) => {
    const stock = popularStocks.find(s => s.symbol === symbol);
    return stock ? stock.name : symbol;
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPredictionData(null);

    try {
      const response = await getStockPrediction(ticker, days);
      
      const historicalData = response.historical_data.map(hist => ({
        date: new Date(hist.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actualPrice: hist.close,
        predictedPrice: null,
        confidenceRange: null
      }));
      
      const predictionData = response.predictions.map(pred => ({
        date: new Date(pred.ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actualPrice: null,
        predictedPrice: pred.yhat,
        confidenceRange: [pred.yhat_lower, pred.yhat_upper]
      }));

      const recentHistorical = historicalData.slice(-30);
      const combinedData = [...recentHistorical, ...predictionData];
      setPredictionData(combinedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)' }}>
      <header style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', padding: '1.5rem 2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>📈 Stock Predictor Platform</h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.5rem' }}>AI-powered stock price forecasting using Prophet</p>
        </div>
      </header>
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>Stock Price Prediction</h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Enter stock ticker symbols (e.g., AAPL, NVDA, GOOGL) to get AI-powered price forecasts</p>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
          <form onSubmit={handlePredict} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Stock Ticker Symbol</label>
              <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="Enter ticker symbol (e.g., AAPL, NVDA)" style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'} />
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Use the stock's ticker symbol (e.g., AAPL for Apple)</p>
            </div>

            <div style={{ minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Prediction Days</label>
              <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', backgroundColor: 'white' }}>
                {[1, 3, 5, 7, 10, 14, 21, 30].map(day => <option key={day} value={day}>{day} day{day > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} style={{ padding: '0.75rem 2rem', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', transition: 'transform 0.2s', minWidth: '120px' }} onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-1px)')} onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
              {loading ? 'Predicting...' : 'Predict'}
            </button>
          </form>
          
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>Popular Stocks:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {popularStocks.map((stock) => (
                <button key={stock.symbol} type="button" onClick={() => setTicker(stock.symbol)} style={{ padding: '0.5rem 1rem', background: ticker === stock.symbol ? '#3b82f6' : '#f8fafc', color: ticker === stock.symbol ? 'white' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onMouseOver={(e) => e.target.style.background = ticker === stock.symbol ? '#2563eb' : '#e2e8f0'} onMouseOut={(e) => e.target.style.background = ticker === stock.symbol ? '#3b82f6' : '#f8fafc'}>
                  <span style={{ fontWeight: '700' }}>{stock.symbol}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{stock.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>{error}</div>}

        {predictionData && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>{ticker} - {getCompanyName(ticker)}</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Next {days} days prediction with confidence intervals</p>
            </div>
            <StockChart data={predictionData} ticker={ticker} />
            
            <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Prediction Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Current Price</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0.25rem 0 0 0' }}>${predictionData.find(d => d.actualPrice)?.actualPrice?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>First Predicted Price</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0.25rem 0 0 0' }}>${predictionData.find(d => d.predictedPrice)?.predictedPrice?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Final Predicted Price</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0.25rem 0 0 0' }}>${predictionData[predictionData.length - 1]?.predictedPrice?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Forecast Period</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0.25rem 0 0 0' }}>{days} days</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>Day-by-Day Forecast</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: '600' }}>Date</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b', fontWeight: '600' }}>Predicted Price</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b', fontWeight: '600' }}>Lower Bound</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b', fontWeight: '600' }}>Upper Bound</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b', fontWeight: '600' }}>Confidence Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictionData.filter(d => d.predictedPrice).map((prediction, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', color: '#1e293b' }}>{prediction.date}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1e293b', fontWeight: '600' }}>${prediction.predictedPrice.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>${prediction.confidenceRange[0].toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>${prediction.confidenceRange[1].toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>±${((prediction.confidenceRange[1] - prediction.confidenceRange[0]) / 2).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!predictionData && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '0.75rem', border: '2px dashed #e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Ready to Predict</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>Enter a stock ticker symbol (like AAPL, NVDA, GOOGL) and click "Predict" to see the forecast</p>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', textAlign: 'left', fontSize: '0.875rem', color: '#475569' }}>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>What are ticker symbols?</p>
              <p style={{ margin: 0 }}>Ticker symbols are short abbreviations used to identify stocks. Examples:</p>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                <li>AAPL = Apple Inc.</li>
                <li>NVDA = NVIDIA Corporation</li>
                <li>GOOGL = Alphabet Inc. (Google)</li>
                <li>TSLA = Tesla, Inc.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
        <p>© 2024 Stock Predictor Platform. Built with FastAPI, React, and Prophet.</p>
      </footer>
    </div>
  );
}

export default App;
