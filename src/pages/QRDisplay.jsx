import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, RefreshCw, Wifi } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const QRDisplay = () => {
  const { locationId } = useParams()
  const [qrCode, setQrCode] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [countdown, setCountdown] = useState(90)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const canvasRef = useRef(null)

  // Location details (would come from API)
  const location = {
    id: locationId,
    name: locationId === 'cengelkoy' ? 'Çengelköy Şubesi' : 'Restoran',
    address: 'İstanbul, Türkiye'
  }

  // Generate new QR code - Contains URL to check-in page with unique token
  const generateNewQR = async () => {
    try {
      // Backend'den benzersiz token al
      const response = await fetch('/.netlify/functions/qr-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId })
      })
      
      const result = await response.json()
      
      if (result.success && result.token) {
        const checkInUrl = `https://takibonline.netlify.app/checkin?token=${result.token}`
        setQrCode(checkInUrl)
        
        // Generate QR code image
        const dataUrl = await QRCode.toDataURL(checkInUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#0369a1',
            light: '#ffffff'
          }
        })
        setQrDataUrl(dataUrl)
      } else {
        console.error('Token oluşturulamadı:', result.error)
      }
    } catch (err) {
      console.error('QR Generate hatası:', err)
    }
    
    setCountdown(90)
  }

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Generate QR code on mount and every 90 seconds
  useEffect(() => {
    generateNewQR()
    const interval = setInterval(generateNewQR, 90000)
    return () => clearInterval(interval)
  }, [locationId])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 90
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#3d1e5d' }}>
      <div className="w-full max-w-2xl">
        {/* mes.ai Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div className="flex justify-center items-center gap-3 mb-4">
            <svg width="50" height="50" viewBox="0 0 100 100" className="text-white">
              <g fill="none" stroke="currentColor" strokeWidth="3.5">
                <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(0 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(45 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(90 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(135 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(180 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(225 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(270 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(315 50 50)"/>
                <circle cx="50" cy="50" r="20" fill="#3d1e5d" stroke="currentColor"/>
                <line x1="50" y1="50" x2="50" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <line x1="50" y1="50" x2="58" y2="55" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="50" cy="50" r="3" fill="white"/>
              </g>
            </svg>
            <span className="text-4xl font-bold text-white tracking-wide lowercase">mes.ai</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Personel Giriş / Çıkış
          </h1>
          <div className="flex items-center justify-center gap-4 md:gap-6 text-white/90 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              <span>{location.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-mono font-semibold">
                {format(currentTime, 'HH:mm:ss')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* QR Code Card - Modern Minimalist */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
        >
          {/* Date Display */}
          <div className="text-center mb-8">
            <p className="text-xl md:text-2xl font-semibold text-gray-800 capitalize">
              {format(currentTime, 'd MMMM yyyy EEEE', { locale: tr })}
            </p>
          </div>

          {/* QR Code - Bigger & Centered */}
          <div className="flex justify-center mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={qrCode}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* QR Code Container */}
                <div className="relative p-8 rounded-3xl shadow-lg" style={{ background: 'linear-gradient(135deg, #f3ebf9 0%, #e4d3f0 100%)' }}>
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="QR Code" 
                      className="w-72 h-72 md:w-96 md:h-96 rounded-2xl"
                    />
                  ) : (
                    <div className="w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
                      <RefreshCw className="w-16 h-16 animate-spin" style={{ color: '#7e3fb0' }} />
                    </div>
                  )}
                  
                  {/* Countdown Badge */}
                  <div className="absolute -top-4 -right-4 text-white rounded-2xl px-5 py-3 shadow-xl" style={{ background: 'linear-gradient(135deg, #5a2d83 0%, #3d1e5d 100%)' }}>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{countdown}</div>
                      <div className="text-xs opacity-90">saniye</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bar - Minimalist */}
          <div className="mb-6">
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
              <motion.div 
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7e3fb0 0%, #3d1e5d 100%)' }}
                animate={{ width: `${(countdown / 90) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 mt-3 text-gray-500 text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>Otomatik Yenileme</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              isOnline 
                ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                : 'bg-red-50 text-red-700 border-2 border-red-200'
            }`}>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {isOnline ? 'Çevrimiçi' : 'Bağlantı Yok'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Footer - 2025 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-white/70"
        >
          <p className="text-sm">
            © 2025 mes.ai
          </p>
          <p className="text-xs mt-1">Personel Takip Sistemi</p>
        </motion.div>
      </div>
    </div>
  )
}

export default QRDisplay
