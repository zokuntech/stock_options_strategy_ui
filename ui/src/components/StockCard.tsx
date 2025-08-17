import { Card, CardContent } from "./ui/card"

interface Stock {
  ticker: string
  companyName: string
  dailyChangePct: number
  rsi: number
}

interface StockCardProps {
  stock: Stock
}

export function StockCard({ stock }: StockCardProps) {
  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Ticker */}
          <div className="text-2xl font-bold text-white">
            {stock.ticker}
          </div>
          
          {/* Company Name */}
          <div className="text-gray-400 text-sm">
            {stock.companyName}
          </div>
          
          {/* Price Change */}
          <div className="text-red-400 text-3xl font-bold">
            {stock.dailyChangePct.toFixed(1)}%
          </div>
          
          {/* RSI */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">RSI</span>
            <span className="text-white text-xl font-medium">
              {stock.rsi.toFixed(1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 