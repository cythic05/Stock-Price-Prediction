# 📈 Stock Price Prediction Platform

AI-powered stock price forecasting using Prophet ML models with interactive visualizations and confidence intervals.

## 🚀 Features

- **Real-time Stock Data**: Fetches historical stock data using yfinance API
- **ML Predictions**: Uses Facebook Prophet for accurate price forecasting
- **Interactive Charts**: Beautiful Recharts visualizations with confidence intervals
- **Popular Stocks**: Quick access to major stocks (AAPL, NVDA, GOOGL, etc.)
- **Customizable**: Choose prediction periods (1-30 days) and historical data ranges
- **Detailed Forecasts**: Day-by-day predictions with confidence ranges
- **Historical Analysis**: Shows historical prices alongside predictions

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, Prophet ML, yfinance
- **Frontend**: React, Recharts, Axios
- **Data**: yfinance API for real-time market data
- **ML Model**: Facebook Prophet for time series forecasting

## 📋 Installation

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the frontend development server**:
   ```bash
   npm start
   ```

## 🎯 Usage

1. **Start the backend**: Run `uvicorn main:app --host 0.0.0.0 --port 8000 --reload` in the backend directory
2. **Start the frontend**: Run `npm start` in the frontend directory
3. **Open your browser**: Navigate to `http://localhost:3000`
4. **Make predictions**:
   - Enter a stock ticker symbol (e.g., AAPL, NVDA, GOOGL)
   - Select prediction days (1-30 days)
   - Click "Predict" to see the forecast

## 📊 How It Works

1. **Data Fetching**: Backend uses yfinance to get historical stock data
2. **ML Processing**: Facebook Prophet analyzes patterns and trends
3. **Prediction**: Generates forecasts with confidence intervals
4. **Visualization**: Frontend displays historical vs predicted prices with interactive charts

## 🌐 API Endpoints

- `GET /` - API health check
- `GET /predict?ticker=AAPL&days=5` - Get stock predictions
  - Returns historical data and forecast with confidence intervals

## 📂 Project Structure

```
stock_pred/
├── backend/
│   ├── main.py              # FastAPI application with ML logic
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main React application
    │   └── index.js         # Entry point
    ├── public/
    │   └── index.html       # HTML template
    └── package.json         # Node.js dependencies
```

## ⚠️ Disclaimer

This project is for educational purposes only. Not financial advice. Always do your own research before making investment decisions.

## 📝 Resume Description

"Developed a full-stack stock price prediction platform using FastAPI, React, and Prophet ML models with interactive visualizations and confidence intervals for investment decision support."

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the MIT License.
