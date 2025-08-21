import { useState, useRef } from 'react'
import { StockCard } from './components/StockCard'
import { FilterControls } from './components/FilterControls'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface Stock {
  ticker: string
  companyName: string
  dailyChangePct: number
  rsi: number
  marketCap?: number
  marketCapBillions?: number
  currentPrice?: number
  previousPrice?: number
  volume?: number
}

function App() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState({ checked: 0, total: 0, found: 0 })
  const [universeInfo, setUniverseInfo] = useState({ size: 0, type: 'unknown' })
  const [clientFiltered, setClientFiltered] = useState(0) // Track client-side filtered stocks
  const [filters, setFilters] = useState({
    minMarketCap: 1e9, // Lower to $1B temporarily to debug - was 50e9
    minDropPercentage: 2.0, // Lower to 2% to match curl example
    timeRange: '1w', // 1 week to match curl example
    maxRsi: 50 // Higher to match curl example and see more results
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const startScreening = async () => {
    setIsScanning(true)
    setStatus('Starting scan...')
    setStocks([])
    setProgress({ checked: 0, total: 0, found: 0 })
    setUniverseInfo({ size: 0, type: 'unknown' })
    setClientFiltered(0) // Reset client-side filter counter

    try {
      abortControllerRef.current = new AbortController()

      const requestBody = {
        period: filters.timeRange,
        min_daily_drop: filters.minDropPercentage,
        max_rsi: filters.maxRsi,
        min_market_cap: filters.minMarketCap,
        max_results: 500,  // Request all possible results
        force_refresh: true,  // Force fresh data
        use_comprehensive_universe: true  // Use the full 5,185+ stock universe
      }

      // Debug: Log the request being sent
      console.log('🚀 Sending request:', requestBody)
      console.log('📊 Market cap filter:', filters.minMarketCap, `($${(filters.minMarketCap / 1e9).toFixed(0)}B)`)

      // Debug: Use streaming endpoint like the working curl command
      console.log('🔬 Using /screen/stream endpoint with market cap filtering...')
      
      const response = await fetch(`${API_BASE_URL}/screen/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setStatus('Scanning stocks...')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('🔚 Stream ended naturally')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6)
              if (jsonData.trim() === '') continue
              
              const data = JSON.parse(jsonData)
              console.log('📨 Raw SSE message:', data.type, data.stock?.ticker || '')
              
              switch (data.type) {
                case 'start': {
                  setProgress(prev => ({ ...prev, total: data.total_symbols }))
                  setUniverseInfo({
                    size: data.universe_size || data.total_symbols,
                    type: data.universe_type || 'unknown'
                  })
                  setStatus(`Scanning ${data.total_symbols} stocks from ${data.universe_type === 'comprehensive' ? 'comprehensive universe' : 'S&P 500'}...`)
                  
                  // Debug: Log filters being applied
                  console.log('📝 Backend filters:', data.filters)
                  console.log('🎯 Scan started with', data.total_symbols, 'symbols to process')
                  break
                }

                case 'result': {
                  // Debug: Log stock data received
                  console.log('📈 Stock result received:', data.stock)
                  console.log('💰 Market cap data:', {
                    market_cap: data.stock.market_cap,
                    market_cap_billions: data.stock.market_cap_billions,
                    formatted: data.stock.market_cap_billions ? `$${data.stock.market_cap_billions}B` : 'N/A'
                  })
                  console.log('📊 Progress:', data.progress)

                  // Client-side filtering as backup since backend streaming might not filter properly
                  const marketCapValue = data.stock.market_cap || (data.stock.market_cap_billions ? data.stock.market_cap_billions * 1e9 : null)
                  
                  // Skip stocks with no market cap data (N/A)
                  if (!marketCapValue || marketCapValue === null || marketCapValue === undefined) {
                    console.log('❌ Skipping stock with no market cap data:', data.stock.ticker)
                    setProgress(data.progress) // Still update progress
                    setClientFiltered(prev => prev + 1)
                    break
                  }
                  
                  // Skip stocks that don't meet minimum market cap filter
                  if (marketCapValue < filters.minMarketCap) {
                    console.log('❌ Skipping stock below market cap filter:', {
                      ticker: data.stock.ticker,
                      marketCap: marketCapValue,
                      marketCapFormatted: marketCapValue >= 1e9 ? `$${(marketCapValue / 1e9).toFixed(1)}B` : `$${(marketCapValue / 1e6).toFixed(0)}M`,
                      minRequired: `$${(filters.minMarketCap / 1e9).toFixed(0)}B`
                    })
                    setProgress(data.progress) // Still update progress
                    setClientFiltered(prev => prev + 1)
                    break
                  }
                  
                  console.log('✅ Stock passes market cap filter:', {
                    ticker: data.stock.ticker,
                    marketCap: marketCapValue,
                    marketCapFormatted: marketCapValue >= 1e9 ? `$${(marketCapValue / 1e9).toFixed(1)}B` : `$${(marketCapValue / 1e6).toFixed(0)}M`
                  })

                  const newStock: Stock = {
                    ticker: data.stock.ticker,
                    companyName: data.stock.company_name || data.stock.ticker,
                    dailyChangePct: data.stock.daily_change_pct,
                    rsi: data.stock.rsi,
                    marketCap: data.stock.market_cap,
                    marketCapBillions: data.stock.market_cap_billions,
                    currentPrice: data.stock.current_price,
                    previousPrice: data.stock.previous_price,
                    volume: data.stock.volume
                  }
                  
                  setStocks(prev => [...prev, newStock])
                  setProgress(data.progress)
                  setStatus(`Scanning... ${data.progress.checked}/${data.progress.total} stocks (${data.progress.found} found, ${clientFiltered} filtered out)`)
                  break
                }

                case 'batch_complete': {
                  setProgress(data.progress)
                  setStatus(`Batch ${data.batch_number} complete • ${data.progress.found} opportunities found`)
                  console.log('📦 Batch complete:', data.batch_number, 'Progress:', data.progress)
                  break
                }
                  
                case 'complete': {
                  const summary = data.summary
                  console.log('✅ Scan complete summary:', summary)
                  console.log('🔍 Client-side filtering stats:', {
                    totalFromBackend: summary.total_found,
                    clientFiltered: clientFiltered,
                    finalDisplayed: stocks.length + 1 // +1 because this stock hasn't been added yet
                  })
                  setStatus(`Scan complete! Found ${summary.total_found} opportunities, ${clientFiltered} filtered out by market cap, ${stocks.length} displayed`)
                  setIsScanning(false)
                  return
                }
                  
                default:
                  console.log('🔍 Unknown message type:', data.type, data)
                  break
              }
            } catch (error) {
              console.error('Error parsing data:', error)
            }
          }
        }
      }
      
      // If we get here, the stream ended without a 'complete' message
      console.log('⚠️ Stream ended without completion message')
      console.log('📊 Final stats:', { 
        stocksFound: stocks.length, 
        lastProgress: progress,
        clientFiltered: clientFiltered 
      })
      setStatus(`Stream ended unexpectedly. Found ${stocks.length} stocks (${clientFiltered} filtered out)`)
      setIsScanning(false)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        setStatus('Scan cancelled')
      } else {
        console.error('Scanning failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setStatus(`Error: ${errorMessage}. Make sure your backend is running on ${API_BASE_URL}`)
      }
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsScanning(false)
    setStatus('Scan stopped')
  }

  const sortedStocks = [...stocks].sort((a, b) => a.dailyChangePct - b.dailyChangePct)

  return (
    <div className="min-h-screen bg-gray-900 p-6 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Oversold Stocks to Watch
          </h1>
          <p className="text-gray-400 text-lg">
            Filter and find the best opportunities across {universeInfo.type === 'comprehensive' ? '5,185+ stocks (S&P 500 + Russell 1000)' : 'all S&P 500 stocks'}
          </p>
          {universeInfo.size > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              Universe: {universeInfo.size.toLocaleString()} stocks • {universeInfo.type === 'comprehensive' ? 'Comprehensive (S&P 500 + Russell 1000)' : 'S&P 500'}
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <FilterControls
          filters={filters}
          onFiltersChange={setFilters}
          onStartScreening={startScreening}
          onStopScreening={stopScanning}
          isScanning={isScanning}
          status={status}
          progress={progress}
          universeInfo={universeInfo}
        />

        {/* Stock Grid */}
        {stocks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
            {sortedStocks.map((stock, index) => (
              <StockCard key={`${stock.ticker}-${index}`} stock={stock} />
            ))}
          </div>
        )}

        {/* Empty State - Only show when not scanning and no stocks */}
        {stocks.length === 0 && !isScanning && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Ready to find oversold stocks?
            </h3>
            <p className="text-gray-500">
              Configure your filters above and click "Start Screening" to discover opportunities across 5,185+ stocks
            </p>
          </div>
        )}

        {/* Loading State */}
        {isScanning && stocks.length === 0 && (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-gray-400 text-lg">
              Scanning comprehensive stock universe...
            </div>
            {universeInfo.size > 0 && (
              <div className="text-gray-500 text-sm mt-2">
                Analyzing {universeInfo.size.toLocaleString()} stocks
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
