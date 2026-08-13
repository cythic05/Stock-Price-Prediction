# 📈 Stock Price Prediction Platform

AI-powered stock price forecasting using Prophet ML models with interactive visualizations and confidence intervals.

## 🚀 Features

- **Real-time Stock Data**: Fetches historical stock data using yfinance API
- **ML Predictions**: Uses Facebook Prophet for accurate price forecasting
- **Interactive Charts**: Beautiful Plotly visualizations with confidence intervals
- **Popular Stocks**: Quick access to major stocks (AAPL, NVDA, GOOGL, etc.)
- **Customizable**: Choose prediction periods (1-30 days) and historical data ranges
- **Detailed Forecasts**: Day-by-day predictions with confidence ranges

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, Prophet ML
- **Frontend**: Streamlit, Plotly
- **Data**: yfinance API for real-time market data
- **Deployment**: Streamlit Cloud ready

## 📋 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cythic05/Stock-Price-Prediction.git
   cd Stock-Price-Prediction
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

## 🎯 Usage

1. **Run the Streamlit app**:
   ```bash
   streamlit run streamlit_app.py
   ```

2. **Open your browser**: Navigate to `http://localhost:8501`

3. **Make predictions**:
   - Enter a stock ticker symbol (e.g., AAPL, NVDA, GOOGL)
   - Select prediction days (1-30 days)
   - Choose historical data period
   - Click "Generate Prediction"

## 🌐 Deployment

### Streamlit Cloud (Recommended)
1. Push code to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your repository
4. Deploy with one click

### Other Platforms
- **Heroku**: Add `Procfile` with `streamlit run streamlit_app.py`
- **Railway**: Direct deployment from GitHub
- **AWS/Azure/GCP**: Deploy as web service

## 📊 How It Works

1. **Data Fetching**: Uses yfinance to get historical stock data
2. **ML Processing**: Facebook Prophet analyzes patterns and trends
3. **Prediction**: Generates forecasts with confidence intervals
4. **Visualization**: Interactive charts show historical vs predicted prices

## ⚠️ Disclaimer

This project is for educational purposes only. Not financial advice. Always do your own research before making investment decisions.

## 📝 Resume Description

"Developed a full-stack stock price prediction platform using Streamlit, Prophet ML models, and yfinance API with interactive visualizations and confidence intervals for investment decision support."

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the MIT License.
