import { Card, CardContent } from "./ui/card"

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

interface StockCardProps {
  stock: Stock
}

const formatMarketCap = (marketCap?: number, marketCapBillions?: number) => {
  // Use the billions field if available (more efficient from backend)
  if (marketCapBillions !== undefined && marketCapBillions !== null) {
    if (marketCapBillions >= 1000) {
      return `$${(marketCapBillions / 1000).toFixed(1)}T`
    } else {
      return `$${marketCapBillions.toFixed(1)}B`
    }
  }
  
  // Fallback to raw market cap
  if (!marketCap) {
    return 'N/A'
  }
  
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(1)}T`
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(1)}B`
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(1)}M`
  }
  return `$${marketCap.toLocaleString()}`
}

const formatVolume = (volume?: number) => {
  if (!volume) return 'N/A'
  
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(1)}B`
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(1)}M`
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(0)}K`
  }
  return volume.toLocaleString()
}

const formatPrice = (price?: number) => {
  if (!price) return 'N/A'
  return `$${price.toFixed(2)}`
}

export function StockCard({ stock }: StockCardProps) {
  const isHighOpportunity = stock.dailyChangePct < -5
  const isOversold = stock.rsi < 30
  
  return (
    <Card className={`${isHighOpportunity ? 'bg-gray-800 border-orange-400' : 'bg-gray-800'} border-gray-700 hover:border-gray-600 transition-colors`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Ticker and Opportunity Level */}
          <div className="flex justify-between items-start">
            <div className="text-2xl font-bold text-white">
              {stock.ticker}
            </div>
            {isHighOpportunity && (
              <div className="text-xs font-medium text-orange-400 bg-orange-900 px-2 py-1 rounded">
                HIGH OPPORTUNITY
              </div>
            )}
          </div>
          
          {/* Company Name */}
          <div className="text-gray-400 text-sm">
            {stock.companyName}
          </div>
          
          {/* Market Cap */}
          <div className="text-gray-300 text-sm font-medium">
            Market Cap: {formatMarketCap(stock.marketCap, stock.marketCapBillions)}
          </div>
          
          {/* Current Price */}
          <div className="text-gray-300 text-sm font-medium">
            Price: {formatPrice(stock.currentPrice)}
            {stock.previousPrice && (
              <span className="text-gray-500 ml-2">
                (was {formatPrice(stock.previousPrice)})
              </span>
            )}
          </div>
          
          {/* Price Change - Main highlight */}
          <div className="text-red-400 text-3xl font-bold">
            {stock.dailyChangePct.toFixed(1)}%
          </div>
          
          {/* RSI and Volume */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">RSI</span>
              <span className={`text-lg font-medium ${isOversold ? 'text-green-400' : stock.rsi < 35 ? 'text-yellow-400' : 'text-white'}`}>
                {stock.rsi.toFixed(1)}
                {isOversold && <span className="ml-1 text-xs">📉</span>}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Volume</span>
              <span className="text-gray-300 text-sm font-medium">
                {formatVolume(stock.volume)}
              </span>
            </div>
          </div>

          {/* Opportunity Indicators */}
          <div className="flex flex-wrap gap-1 pt-2">
            {stock.dailyChangePct < -10 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Extreme Drop
              </span>
            )}
            {stock.dailyChangePct < -5 && stock.dailyChangePct >= -10 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Big Drop
              </span>
            )}
            {isOversold && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Oversold
              </span>
            )}
            {stock.volume && stock.volume > 1000000 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                High Volume
              </span>
            )}
            {stock.marketCapBillions && stock.marketCapBillions > 100 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Large Cap
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 