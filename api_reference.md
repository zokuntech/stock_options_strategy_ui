# Stock Screener API Reference

## 📡 **API Base URL**
- **Local Development**: `http://localhost:8000`
- **Production**: `https://your-production-url.com`

## 🎯 **Available Endpoints**

### 1. **Quick Screen** ⚡ (6-10 seconds)
**Best for**: Instant preview, mobile apps, simple integrations

```bash
POST /screen/quick
Content-Type: application/json

{
  "period": "1w",           // "1d", "3d", "1w", "2w", "1m", "3m", "ytd"
  "min_daily_drop": 1.5,    // Minimum % drop required
  "max_rsi": 50.0,          // Maximum RSI (oversold threshold)
  "max_results": 20         // Limit results
}
```

**Response**: Standard JSON with immediate results from top 50 blue-chip stocks.

### 2. **JSON Stream** 🌊 (20-40 seconds)
**Best for**: Standard APIs, mobile apps wanting more comprehensive results

```bash
POST /screen/json-stream
Content-Type: application/json

{
  "period": "1w",
  "min_daily_drop": 2.0,
  "max_rsi": 35.0,
  "max_results": 50
}
```

**Response**: Clean JSON after streaming internally through 100 S&P 500 stocks.

### 3. **Live Stream** 📡 (Real-time SSE)
**Best for**: Modern UIs, dashboards, real-time experience

```bash
POST /screen/stream
Content-Type: application/json

{
  "period": "1w",
  "min_daily_drop": 2.0,
  "max_rsi": 30.0,
  "max_results": 50
}
```

**Response**: Server-Sent Events (SSE) with real-time progress and results.

### 4. **Full Screen** 🔍 (5-7 minutes)
**Best for**: Comprehensive analysis, background jobs

```bash
POST /screen
Content-Type: application/json

{
  "period": "1w",
  "min_daily_drop": 2.5,
  "max_rsi": 35.0,
  "max_results": 500,
  "force_refresh": true
}
```

**Response**: Complete analysis of all 500 S&P 500 companies.

## 📊 **Response Format**

### Standard JSON Response
```json
{
  "total_found": 7,
  "total_checked": 100,
  "performance": {
    "total_time_seconds": 40.9,
    "screening_type": "json_stream"
  },
  "filters_applied": {
    "min_market_cap": 10000000000,
    "max_rsi": 35.0,
    "min_daily_drop": 2.0,
    "period": "1w"
  },
  "results": [
    {
      "ticker": "CE",
      "current_price": 42.62,
      "daily_change_pct": -15.08,
      "rsi": 28.6,
      "volume": 3401019,
      "period_analyzed": "1w",
      "previous_price": 41.8
    }
  ],
  "scan_timestamp": "2025-08-15T17:59:24.757152",
  "data_source": "Alpha Vantage Premium"
}
```

### SSE Stream Response
```
data: {"type": "start", "total_symbols": 100, "filters": {...}}

data: {"type": "result", "stock": {"ticker": "CE", "current_price": 42.62, ...}, "progress": {"checked": 88, "total": 100, "found": 1}}

data: {"type": "batch_complete", "batch_number": 9, "progress": {"checked": 90, "total": 100, "found": 1}}

data: {"type": "complete", "summary": {"total_found": 2, "results": [...]}}
```

## 🔧 **JavaScript Implementation Examples**

### Quick Screen (Simple)
```javascript
async function quickScreen() {
  const response = await fetch('http://localhost:8000/screen/quick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      period: '1w',
      min_daily_drop: 1.5,
      max_rsi: 50.0,
      max_results: 20
    })
  });
  
  const data = await response.json();
  displayResults(data.results);
}
```

### SSE Stream (Real-time)
```javascript
function startLiveStream() {
  const eventSource = new EventSource('/screen/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      period: '1w',
      min_daily_drop: 2.0,
      max_rsi: 30.0,
      max_results: 50
    })
  });

  eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
      case 'start':
        updateProgress(0, data.total_symbols);
        break;
        
      case 'result':
        addStockToTable(data.stock);
        updateProgress(data.progress.checked, data.progress.total);
        showFoundCount(data.progress.found);
        break;
        
      case 'batch_complete':
        updateProgress(data.progress.checked, data.progress.total);
        break;
        
      case 'complete':
        showFinalResults(data.summary);
        eventSource.close();
        break;
    }
  };

  eventSource.onerror = function(error) {
    console.error('SSE Error:', error);
    eventSource.close();
  };
}
```

### Hybrid Approach (Recommended)
```javascript
async function hybridScreen() {
  // 1. Show quick results immediately
  showLoading("Getting quick results...");
  const quickResponse = await fetch('/screen/quick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period: '1w', min_daily_drop: 1.5, max_rsi: 50 })
  });
  
  const quickData = await quickResponse.json();
  displayInitialResults(quickData.results);
  
  // 2. Start comprehensive stream in background
  showLoading("Starting comprehensive scan...");
  const eventSource = new EventSource('/screen/stream');
  
  eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'result') {
      addOrUpdateStock(data.stock);
    }
  };
}
```

## 🎨 **UI Components Needed**

### 1. **Stock Result Card**
```javascript
function createStockCard(stock) {
  return `
    <div class="stock-card ${stock.daily_change_pct < -5 ? 'high-opportunity' : ''}">
      <div class="ticker">${stock.ticker}</div>
      <div class="price">$${stock.current_price}</div>
      <div class="change ${stock.daily_change_pct < 0 ? 'negative' : 'positive'}">
        ${stock.daily_change_pct.toFixed(2)}%
      </div>
      <div class="rsi">RSI: ${stock.rsi.toFixed(1)}</div>
      <div class="volume">Vol: ${stock.volume?.toLocaleString() || 'N/A'}</div>
    </div>
  `;
}
```

### 2. **Progress Bar**
```javascript
function updateProgress(checked, total) {
  const percentage = (checked / total) * 100;
  document.getElementById('progress-bar').style.width = `${percentage}%`;
  document.getElementById('progress-text').textContent = `${checked}/${total} stocks checked`;
}
```

### 3. **Filter Controls**
```javascript
const filterForm = {
  period: ['1d', '3d', '1w', '2w', '1m'],
  min_daily_drop: [1.0, 1.5, 2.0, 2.5, 3.0, 5.0],
  max_rsi: [25, 30, 35, 40, 45, 50],
  max_results: [10, 20, 50, 100, 500]
};
```

## 🚀 **Performance Optimization**

### API Call Timing
- **Quick Screen**: 6-10 seconds (50 stocks)
- **JSON Stream**: 20-40 seconds (100 stocks)  
- **SSE Stream**: 20-40 seconds (100 stocks, real-time)
- **Full Screen**: 5-7 minutes (500 stocks)

### Rate Limiting
- **Premium Alpha Vantage**: 150 calls/minute
- **Processing Speed**: ~86 calls/minute average
- **Efficient batching**: 10-20 stocks per batch

## 🎯 **Best Practices**

1. **Start with Quick Screen** for instant gratification
2. **Use SSE Stream** for live progress and better UX
3. **Implement caching** on frontend to avoid duplicate calls
4. **Show progress bars** during longer operations
5. **Handle errors gracefully** (network issues, API limits)
6. **Responsive design** for mobile and desktop
7. **Real-time updates** feel more professional

## 🔥 **Example Results to Expect**

Recent screening found excellent opportunities:
- **CE (Celanese)**: -15.08% drop, RSI 28.6 ⭐⭐⭐
- **AMCR (Amcor)**: -11.96% drop, RSI 33.4 ⭐⭐⭐  
- **AIV (Apartment Investment)**: -11.56% drop, RSI 34.5 ⭐⭐⭐
- **AMT (American Tower)**: -4.38% drop, RSI 31.5 ⭐⭐
- **TSLA (Tesla)**: -3.84% drop, RSI 57.3 ⭐
- **WFC (Wells Fargo)**: -2.0% drop, RSI 49.8 ⭐

Perfect for bull put credit spreads! 🎯 