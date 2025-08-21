import { Button } from "./ui/button"

interface FilterControlsProps {
  filters: {
    minMarketCap: number
    minDropPercentage: number
    timeRange: string
    maxRsi: number
  }
  onFiltersChange: (filters: any) => void
  onStartScreening: () => void
  onStopScreening: () => void
  isScanning: boolean
  status: string
  progress?: {
    checked: number
    total: number
    found: number
  }
  universeInfo?: {
    size: number
    type: string
  }
}

export function FilterControls({ 
  filters, 
  onFiltersChange, 
  onStartScreening, 
  onStopScreening, 
  isScanning,
  status,
  progress,
  universeInfo 
}: FilterControlsProps) {
  
  const marketCapOptions = [
    { value: 0, label: 'No minimum' },
    { value: 100e6, label: '$100M+' },
    { value: 500e6, label: '$500M+' },
    { value: 1e9, label: '$1B+' },
    { value: 5e9, label: '$5B+' },
    { value: 10e9, label: '$10B+' },
    { value: 50e9, label: '$50B+' },
    { value: 100e9, label: '$100B+' },
    { value: 500e9, label: '$500B+' }
  ]

  const dropPercentageOptions = [
    { value: 1.0, label: '1%+' },
    { value: 2.0, label: '2%+' },
    { value: 3.0, label: '3%+' },
    { value: 5.0, label: '5%+' },
    { value: 7.5, label: '7.5%+' },
    { value: 10.0, label: '10%+' }
  ]

  const timeRangeOptions = [
    { value: '1d', label: '1 Day' },
    { value: '3d', label: '3 Days' },
    { value: '1w', label: '1 Week' },
    { value: '2w', label: '2 Weeks' },
    { value: '1m', label: '1 Month' },
    { value: '3m', label: '3 Months' },
    { value: 'ytd', label: 'Year to Date' }
  ]

  const rsiOptions = [
    { value: 20, label: '20 (Extremely Oversold)' },
    { value: 25, label: '25 (Very Oversold)' },
    { value: 30, label: '30 (Oversold)' },
    { value: 35, label: '35 (Moderately Oversold)' },
    { value: 40, label: '40 (Slightly Oversold)' },
    { value: 45, label: '45 (Near Neutral)' },
    { value: 50, label: '50 (Neutral)' }
  ]

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Filter Options</h2>
        <div className="text-sm text-gray-400">
          {universeInfo?.type === 'comprehensive' ? (
            <span>
              Comprehensive Universe: {universeInfo?.size?.toLocaleString() || '5,185+'} stocks
            </span>
          ) : universeInfo?.size ? (
            <span>
              {universeInfo?.type === 'sp500_fallback' ? 'S&P 500' : 'Stock Universe'}: {universeInfo.size.toLocaleString()} stocks
            </span>
          ) : (
            <span>Scanning across comprehensive stock universe</span>
          )}
        </div>
      </div>
      
      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Market Cap Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Market Cap
          </label>
          <select
            value={filters.minMarketCap}
            onChange={(e) => handleFilterChange('minMarketCap', Number(e.target.value))}
            disabled={isScanning}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {marketCapOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Drop Percentage Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Drop %
          </label>
          <select
            value={filters.minDropPercentage}
            onChange={(e) => handleFilterChange('minDropPercentage', Number(e.target.value))}
            disabled={isScanning}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dropPercentageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Time Range
          </label>
          <select
            value={filters.timeRange}
            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
            disabled={isScanning}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* RSI Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Maximum RSI
          </label>
          <select
            value={filters.maxRsi}
            onChange={(e) => handleFilterChange('maxRsi', Number(e.target.value))}
            disabled={isScanning}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {rsiOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons and Status */}
      <div className="flex gap-4 items-center mb-4">
        {!isScanning ? (
          <Button
            onClick={onStartScreening}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {universeInfo?.type === 'comprehensive' && universeInfo?.size ? 
              `Start Screening ${universeInfo.size.toLocaleString()} Stocks` : 
              'Start Comprehensive Screening'
            }
          </Button>
        ) : (
          <Button
            onClick={onStopScreening}
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

        {/* Progress Stats */}
        {progress && progress.total > 0 && (
          <div className="flex gap-4 text-sm">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full">
              Scanned: {progress.checked}/{progress.total}
            </div>
            <div className="bg-green-600 text-white px-3 py-1 rounded-full">
              Found: {progress.found}
            </div>
            {universeInfo?.type === 'comprehensive' && (
              <div className="bg-purple-600 text-white px-3 py-1 rounded-full">
                Comprehensive Universe
              </div>
            )}
            {progress.total > 500 && (
              <div className="bg-orange-600 text-white px-3 py-1 rounded-full">
                Large Scale Scan
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Summary as Badges */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-300">Current Filters:</div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            Market Cap ≥ ${(filters.minMarketCap / 1e9).toFixed(0)}B
          </span>
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
            Drop ≥ {filters.minDropPercentage}%
          </span>
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
            RSI ≤ {filters.maxRsi}
          </span>
          <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm">
            {timeRangeOptions.find(opt => opt.value === filters.timeRange)?.label}
          </span>
        </div>
      </div>
    </div>
  )
} 