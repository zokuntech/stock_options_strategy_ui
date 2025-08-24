import { Card, CardContent } from "./ui/card"


interface VixData {
  vix_level: number
  sentiment: string
  description: string
  color: string
  date: string
  daily_data: {
    open: number
    high: number
    low: number
    close: number
    volume: number
  }
  interpretation: {
    very_low: string
    low: string
    moderate: string
    high: string
    extreme: string
  }
}

interface VixModalProps {
  vixData: VixData
  isOpen: boolean
  onClose: () => void
}

export function VixModal({ vixData, isOpen, onClose }: VixModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">VIX (Volatility Index)</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {/* Date */}
            <div className="text-sm text-gray-500">
              Data from {vixData.date}
            </div>

            {/* VIX Level and Sentiment */}
            <div className="text-center space-y-2">
              <div 
                className="text-4xl font-bold"
                style={{ color: vixData.color }}
              >
                {vixData.vix_level.toFixed(1)}
              </div>
              <div 
                className="text-lg font-medium"
                style={{ color: vixData.color }}
              >
                {vixData.sentiment}
              </div>
              <div className="text-sm text-gray-400">
                {vixData.description}
              </div>
            </div>

            {/* Daily Data */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Daily Trading Data</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Open:</span>
                    <span className="text-white font-medium">{vixData.daily_data.open.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">High:</span>
                    <span className="text-white font-medium">{vixData.daily_data.high.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Low:</span>
                    <span className="text-white font-medium">{vixData.daily_data.low.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Volume:</span>
                    <span className="text-white font-medium">
                      {(vixData.daily_data.volume / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interpretation Scale */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">VIX Interpretation</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">{vixData.interpretation.very_low}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">{vixData.interpretation.low}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">{vixData.interpretation.moderate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">{vixData.interpretation.high}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">{vixData.interpretation.extreme}</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
