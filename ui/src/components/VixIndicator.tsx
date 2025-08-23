import { useState, useEffect } from 'react'
import { VixModal } from './VixModal'

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

export function VixIndicator() {
  const [vixData, setVixData] = useState<VixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchVixData = async () => {
      try {
        setLoading(true)
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/vix`
        console.log('🎯 Fetching VIX from:', apiUrl)
        
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📊 VIX Response:', data)
        console.log('🔢 VIX Level:', data.vix_level)
        setVixData(data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch VIX data:', err)
        setError('Failed to load VIX data')
      } finally {
        setLoading(false)
      }
    }

    fetchVixData()
    
    // Refresh VIX data every 5 minutes
    const interval = setInterval(fetchVixData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400 text-sm">
        <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span>VIX...</span>
      </div>
    )
  }

  if (error || !vixData) {
    return (
      <div className="text-gray-500 text-sm">
        VIX unavailable
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 hover:bg-gray-800 rounded-lg p-2 transition-colors group"
      >
        {/* VIX Icon */}
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-gray-600">
          <span className="text-xs font-bold text-white">📊</span>
        </div>
        
        {/* VIX Data */}
        <div className="text-left">
          <div className="flex items-center space-x-2">
            <span 
              className="text-lg font-bold"
              style={{ color: vixData.color }}
            >
              {vixData.vix_level.toFixed(1)}
            </span>
            <span 
              className="text-xs font-medium"
              style={{ color: vixData.color }}
            >
              {vixData.sentiment}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Click for details
          </div>
        </div>
      </button>

      {/* Modal */}
      <VixModal 
        vixData={vixData}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
