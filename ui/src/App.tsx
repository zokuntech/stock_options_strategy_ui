import { useState, useRef } from 'react'
import { StockCard } from './components/StockCard'
import { Button } from './components/ui/button'

const API_BASE_URL = 'http://localhost:8000'

// Sample data matching your design
const sampleStocks = [
  {
    ticker: "DASH",
    companyName: "DoorDash",
    dailyChangePct: -6.4,
    rsi: 49.3
  },
  {
    ticker: "BRK.B",
    companyName: "Berkshire Hathaway",
    dailyChangePct: -5.7,
    rsi: 44.7
  },
  {
    ticker: "UNH",
    companyName: "UnitedHealth Group", 
    dailyChangePct: -5.6,
    rsi: 40.8
  },
  {
    ticker: "AVGO",
    companyName: "Broadcom",
    dailyChangePct: -5.3,
    rsi: 46.2
  }
]

interface Stock {
  ticker: string
  companyName: string
  dailyChangePct: number
  rsi: number
}

function App() {
  const [stocks, setStocks] = useState<Stock[]>(sampleStocks)
  const [isScanning, setIsScanning] = useState(false)
  const [status, setStatus] = useState('')
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const startScreening = async () => {
    setIsScanning(true)
    setStatus('Starting scan...')
    setStocks([])

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch(`${API_BASE_URL}/screen/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: '1w',
          min_daily_drop: 5.0,
          max_rsi: 50.0,
          max_results: 20
        }),
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
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6)
              if (jsonData.trim() === '') continue
              
              const data = JSON.parse(jsonData)
              
              switch (data.type) {
                case 'result':
                  const newStock: Stock = {
                    ticker: data.stock.ticker,
                    companyName: data.stock.company_name || data.stock.ticker,
                    dailyChangePct: data.stock.daily_change_pct,
                    rsi: data.stock.rsi
                  }
                  setStocks(prev => [...prev, newStock])
                  setStatus(`Found ${data.progress.found} oversold stocks`)
                  break
                  
                case 'complete':
                  setStatus(`Scan complete! Found ${data.summary.total_found} opportunities`)
                  setIsScanning(false)
                  return
              }
            } catch (error) {
              console.error('Error parsing data:', error)
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus('Scan cancelled')
      } else {
        console.error('Scanning failed:', error)
        setStatus(`Error: ${error.message}`)
        // Fallback to sample data on error
        setStocks(sampleStocks)
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
            50B+ market cap & 5%+ drop
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 items-center">
          {!isScanning ? (
            <Button
              onClick={startScreening}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Screening
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="destructive"
            >
              Stop Screening
            </Button>
          )}
          
          {status && (
            <div className="text-gray-300 text-sm">
              {status}
            </div>
          )}
        </div>

        {/* Stock Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
          {sortedStocks.map((stock, index) => (
            <StockCard key={`${stock.ticker}-${index}`} stock={stock} />
          ))}
        </div>

        {/* Empty State */}
        {stocks.length === 0 && !isScanning && (
          <div className="text-center py-20">
            <div className="text-gray-500 text-lg">
              Click "Start Screening" to find oversold stocks
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
