from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import yfinance as yf
import pandas as pd
from prophet import Prophet
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# Configuration
class Config:
    APP_NAME = "Stock Predictor API"
    APP_VERSION = "1.0.0"
    CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
    DEFAULT_PREDICTION_DAYS = 5
    MAX_PREDICTION_DAYS = 30

config = Config()

# Pydantic Models
class HistoricalData(BaseModel):
    date: str
    close: float

class DailyPrediction(BaseModel):
    ds: str
    yhat: float
    yhat_lower: float
    yhat_upper: float

class PredictionResponse(BaseModel):
    ticker: str
    days_predicted: int
    historical_data: List[HistoricalData]
    predictions: List[DailyPrediction]

# Data Fetching
def get_stock_history(ticker: str, period: str = "1y") -> pd.DataFrame:
    """Fetches historical daily stock data."""
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        
        if df.empty:
            raise ValueError(f"No data found for ticker {ticker}. Please check the symbol and try again.")
            
        df = df.reset_index()
        
        if 'Date' not in df.columns:
            if df.index.name == 'Date' or 'date' in str(df.index.name).lower():
                df.index.name = 'Date'
            else:
                df = df.reset_index()
                df = df.rename(columns={df.columns[0]: 'Date'})
        
        return df[['Date', 'Close']]
        
    except Exception as e:
        if "No data found" in str(e):
            raise ValueError(f"Invalid ticker symbol: {ticker}")
        else:
            raise ValueError(f"Error fetching data for {ticker}: {str(e)}")

# Prediction Service
def predict_future_prices(historical_df: pd.DataFrame, days_to_predict: int = 5):
    """Predicts stock prices for the next n days."""
    
    df_prophet = historical_df.rename(columns={"Date": "ds", "Close": "y"})
    
    if df_prophet['ds'].dt.tz is not None:
        df_prophet['ds'] = df_prophet['ds'].dt.tz_localize(None)
    
    if len(df_prophet) < 2:
        raise ValueError("Insufficient historical data for prediction. Need at least 2 data points.")
    
    model = Prophet(
        daily_seasonality=True,
        yearly_seasonality=False,
        weekly_seasonality=True,
        changepoint_prior_scale=0.05,
        seasonality_prior_scale=10
    )
    
    try:
        model.fit(df_prophet)
    except Exception as e:
        raise ValueError(f"Failed to train prediction model: {str(e)}")
    
    future = model.make_future_dataframe(periods=days_to_predict)
    forecast = model.predict(future)
    
    predictions = forecast.tail(days_to_predict)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    predictions['ds'] = predictions['ds'].dt.strftime('%Y-%m-%d')
    
    return predictions.to_dict(orient="records")

# FastAPI App
app = FastAPI(title=config.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Stock Predictor API is running", "version": config.APP_VERSION}

@app.get("/predict", response_model=PredictionResponse)
async def get_stock_prediction(
    ticker: str = Query(..., description="The stock ticker symbol (e.g., AAPL)"),
    days: int = Query(config.DEFAULT_PREDICTION_DAYS, ge=1, le=config.MAX_PREDICTION_DAYS, description="Number of future days to predict")
):
    """Accepts a stock ticker and day count, fetches historical data, runs ML prediction, and returns forecasted prices."""
    try:
        historical_df = get_stock_history(ticker=ticker, period="1y")
        
        historical_data = []
        for _, row in historical_df.iterrows():
            historical_data.append({
                "date": row['Date'].strftime('%Y-%m-%d'),
                "close": float(row['Close'])
            })
        
        forecast = predict_future_prices(historical_df=historical_df, days_to_predict=days)
        
        return {
            "ticker": ticker.upper(),
            "days_predicted": days,
            "historical_data": historical_data,
            "predictions": forecast
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred during prediction.")
