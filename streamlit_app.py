import streamlit as st
import yfinance as yf
import pandas as pd
from prophet import Prophet
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# Page configuration
st.set_page_config(
    page_title="Stock Predictor Platform",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1e293b;
        margin-bottom: 0.5rem;
    }
    .sub-header {
        font-size: 1rem;
        color: #64748b;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f8fafc;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar with controls
st.sidebar.title("📊 Stock Predictor")

# Popular stocks
popular_stocks = {
    'AAPL': 'Apple Inc.',
    'NVDA': 'NVIDIA Corporation',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'TSLA': 'Tesla, Inc.',
    'AMZN': 'Amazon.com, Inc.',
    'META': 'Meta Platforms, Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'V': 'Visa Inc.',
    'WMT': 'Walmart Inc.'
}

# Stock ticker input
st.sidebar.subheader("Stock Selection")
ticker = st.sidebar.text_input(
    "Stock Ticker Symbol",
    value="AAPL",
    help="Enter the stock ticker symbol (e.g., AAPL, NVDA, GOOGL)"
).upper()

# Quick select buttons
st.sidebar.subheader("Popular Stocks")
cols = st.sidebar.columns(2)
for i, (symbol, name) in enumerate(popular_stocks.items()):
    col = cols[i % 2]
    if col.button(f"{symbol} - {name}", key=symbol):
        ticker = symbol

# Prediction parameters
st.sidebar.subheader("Prediction Parameters")
days = st.sidebar.slider(
    "Prediction Days",
    min_value=1,
    max_value=30,
    value=5,
    help="Number of future days to predict"
)

# Historical data period
period = st.sidebar.selectbox(
    "Historical Data Period",
    ["1y", "6mo", "3mo", "1mo"],
    index=0,
    help="Amount of historical data to use for prediction"
)

# Data fetching function
@st.cache_data(ttl=3600)  # Cache for 1 hour
def get_stock_data(ticker, period="1y"):
    """Fetch historical stock data using yfinance."""
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        
        if df.empty:
            raise ValueError(f"No data found for ticker {ticker}")
        
        df = df.reset_index()
        
        # Handle different column names
        if 'Date' not in df.columns:
            if df.index.name == 'Date' or 'date' in str(df.index.name).lower():
                df.index.name = 'Date'
            else:
                df = df.reset_index()
                df = df.rename(columns={df.columns[0]: 'Date'})
        
        return df[['Date', 'Close']]
    except Exception as e:
        raise ValueError(f"Error fetching data for {ticker}: {str(e)}")

# Prediction function
def predict_prices(df, days_to_predict=5):
    """Predict stock prices using Prophet."""
    # Prepare data for Prophet
    df_prophet = df.rename(columns={"Date": "ds", "Close": "y"})
    
    # Remove timezone if present
    if df_prophet['ds'].dt.tz is not None:
        df_prophet['ds'] = df_prophet['ds'].dt.tz_localize(None)
    
    # Check minimum data requirement
    if len(df_prophet) < 2:
        raise ValueError("Insufficient historical data for prediction")
    
    # Create and fit Prophet model
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
    
    # Make predictions
    future = model.make_future_dataframe(periods=days_to_predict)
    forecast = model.predict(future)
    
    # Extract predictions
    predictions = forecast.tail(days_to_predict)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    
    return df, predictions

# Main app
def main():
    # Header
    st.markdown('<h1 class="main-header">📈 Stock Predictor Platform</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">AI-powered stock price forecasting using Prophet ML models</p>', unsafe_allow_html=True)
    
    # Information section
    with st.expander("ℹ️ How to use this app"):
        st.markdown("""
        **Instructions:**
        1. Enter a stock ticker symbol (e.g., AAPL, NVDA, GOOGL) in the sidebar
        2. Select the number of days to predict (1-30 days)
        3. Choose the historical data period for training
        4. Click "Generate Prediction" to see the forecast
        
        **What are ticker symbols?**
        Ticker symbols are short abbreviations used to identify stocks:
        - AAPL = Apple Inc.
        - NVDA = NVIDIA Corporation
        - GOOGL = Alphabet Inc. (Google)
        - TSLA = Tesla, Inc.
        
        **Note:** This is for educational purposes only. Not financial advice.
        """)
    
    # Generate prediction button
    if st.button("🚀 Generate Prediction", type="primary", use_container_width=True):
        with st.spinner("Fetching data and generating predictions..."):
            try:
                # Get stock data
                historical_data = get_stock_data(ticker, period)
                
                # Generate predictions
                historical_df, predictions = predict_prices(historical_data, days)
                
                # Display success message
                st.success(f"Successfully generated {days}-day prediction for {ticker}")
                
                # Get company name
                company_name = popular_stocks.get(ticker, ticker)
                
                # Display stock info
                col1, col2, col3, col4 = st.columns(4)
                
                current_price = historical_df['Close'].iloc[-1]
                first_prediction = predictions['yhat'].iloc[0]
                final_prediction = predictions['yhat'].iloc[-1]
                
                with col1:
                    st.metric("Current Price", f"${current_price:.2f}")
                with col2:
                    st.metric("First Prediction", f"${first_prediction:.2f}")
                with col3:
                    st.metric("Final Prediction", f"${final_prediction:.2f}")
                with col4:
                    st.metric("Prediction Period", f"{days} days")
                
                # Create visualization
                st.subheader(f"{ticker} - {company_name} Price Analysis")
                
                # Prepare data for plotting
                historical_plot = historical_df.tail(30)  # Last 30 days for cleaner plot
                historical_plot['Type'] = 'Historical'
                
                predictions_plot = predictions.copy()
                predictions_plot = predictions_plot.rename(columns={'ds': 'Date', 'yhat': 'Close'})
                predictions_plot['Type'] = 'Predicted'
                
                # Combine data
                combined_data = pd.concat([
                    historical_plot[['Date', 'Close', 'Type']],
                    predictions_plot[['Date', 'Close', 'Type']]
                ], ignore_index=True)
                
                # Create interactive plot
                fig = make_subplots(specs=[[{"secondary_y": False}]])
                
                # Add historical data
                fig.add_trace(
                    go.Scatter(
                        x=historical_plot['Date'],
                        y=historical_plot['Close'],
                        mode='lines',
                        name='Historical Price',
                        line=dict(color='#94A3B8', width=2),
                        hovertemplate='<b>%{x}</b><br>Price: $%{y:.2f}<extra></extra>'
                    )
                )
                
                # Add predicted data
                fig.add_trace(
                    go.Scatter(
                        x=predictions_plot['Date'],
                        y=predictions_plot['Close'],
                        mode='lines+markers',
                        name='Predicted Price',
                        line=dict(color='#3B82F6', width=3),
                        marker=dict(size=6, color='#3B82F6'),
                        hovertemplate='<b>%{x}</b><br>Predicted: $%{y:.2f}<extra></extra>'
                    )
                )
                
                # Add confidence interval
                fig.add_trace(
                    go.Scatter(
                        x=predictions_plot['Date'].tolist() + predictions_plot['Date'].tolist()[::-1],
                        y=predictions_plot['yhat_upper'].tolist() + predictions_plot['yhat_lower'].tolist()[::-1],
                        fill='toself',
                        fillcolor='rgba(59, 130, 246, 0.2)',
                        line=dict(color='rgba(59, 130, 246, 0)'),
                        name='Confidence Interval',
                        hoverinfo='skip'
                    )
                )
                
                # Add confidence bound lines
                fig.add_trace(
                    go.Scatter(
                        x=predictions_plot['Date'],
                        y=predictions_plot['yhat_upper'],
                        mode='lines',
                        name='Upper Bound',
                        line=dict(color='#3B82F6', width=1, dash='dash'),
                        opacity=0.6,
                        hovertemplate='<b>%{x}</b><br>Upper: $%{y:.2f}<extra></extra>'
                    )
                )
                
                fig.add_trace(
                    go.Scatter(
                        x=predictions_plot['Date'],
                        y=predictions_plot['yhat_lower'],
                        mode='lines',
                        name='Lower Bound',
                        line=dict(color='#3B82F6', width=1, dash='dash'),
                        opacity=0.6,
                        hovertemplate='<b>%{x}</b><br>Lower: $%{y:.2f}<extra></extra>'
                    )
                )
                
                # Update layout
                fig.update_layout(
                    title="Stock Price Forecast with Confidence Intervals",
                    xaxis_title="Date",
                    yaxis_title="Price ($)",
                    hovermode='x unified',
                    template='plotly_white',
                    height=500,
                    showlegend=True,
                    legend=dict(
                        yanchor="top",
                        y=0.99,
                        xanchor="left",
                        x=0.01
                    )
                )
                
                st.plotly_chart(fig, use_container_width=True)
                
                # Display prediction table
                st.subheader("Day-by-Day Forecast")
                
                # Format predictions for display
                display_data = predictions.copy()
                display_data['Date'] = pd.to_datetime(display_data['ds']).dt.strftime('%B %d, %Y')
                display_data['Predicted Price'] = display_data['yhat'].apply(lambda x: f"${x:.2f}")
                display_data['Lower Bound'] = display_data['yhat_lower'].apply(lambda x: f"${x:.2f}")
                display_data['Upper Bound'] = display_data['yhat_upper'].apply(lambda x: f"${x:.2f}")
                display_data['Confidence Range'] = ((display_data['yhat_upper'] - display_data['yhat_lower']) / 2).apply(lambda x: f"±${x:.2f}")
                
                display_data = display_data[['Date', 'Predicted Price', 'Lower Bound', 'Upper Bound', 'Confidence Range']]
                display_data.columns = ['Date', 'Predicted Price', 'Lower Bound', 'Upper Bound', 'Confidence Range']
                
                st.dataframe(
                    display_data,
                    use_container_width=True,
                    hide_index=True
                )
                
            except ValueError as e:
                st.error(f"Error: {str(e)}")
            except Exception as e:
                st.error(f"An unexpected error occurred: {str(e)}")
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #64748b; font-size: 0.875rem;'>
        <p>© 2024 Stock Predictor Platform. Built with Streamlit, yfinance, and Prophet.</p>
        <p style='font-size: 0.75rem; margin-top: 0.5rem;'>⚠️ This is for educational purposes only. Not financial advice.</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
