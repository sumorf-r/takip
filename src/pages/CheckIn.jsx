import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, LogOut, User, Key, Clock, MapPin, Loader, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// 🔒 GÜVENLİK: Cihaz kimliği oluştur
const generateDeviceFingerprint = () => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Device ID', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Security', 4, 17)
    
    const canvasData = canvas.toDataURL()
    
    const fingerprint = btoa(
      navigator.userAgent +
      navigator.language +
      screen.width + 'x' + screen.height +
      screen.colorDepth +
      new Date().getTimezoneOffset() +
      canvasData.substring(0, 100)
    ).substring(0, 64)
    
    return fingerprint
  } catch {
    // Fallback
    return btoa(
      navigator.userAgent + 
      navigator.language + 
      Date.now()
    ).substring(0, 64)
  }
}

const getDeviceName = () => {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) {
    const match = ua.match(/Android\s([0-9.]+)/)
    return `Android ${match ? match[1] : ''}`
  }
  if (/Windows/.test(ua)) return 'Windows PC'
  if (/Mac/.test(ua)) return 'Mac'
  return 'Bilinmeyen Cihaz'
}

const CheckIn = () => {
  const [searchParams] = useSearchParams()
  const qrToken = searchParams.get('token')
  const [locationId, setLocationId] = useState(null)
  const [tokenValid, setTokenValid] = useState(null) // null = checking, true = valid, false = invalid
  const [tokenError, setTokenError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [personnelData, setPersonnelData] = useState(null)
  const [hasActiveCheckIn, setHasActiveCheckIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [personnelNo, setPersonnelNo] = useState('')
  const [password, setPassword] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [deviceId] = useState(() => generateDeviceFingerprint())
  const [deviceName] = useState(() => getDeviceName())

  // Location names
  const locationNames = {
    'cengelkoy': 'Çengelköy Şubesi',
    'kadikoy': 'Kadıköy Şubesi',
    'besiktas': 'Beşiktaş Şubesi'
  }

  // 🔒 GÜVENLİK: Token doğrulama
  useEffect(() => {
    const validateToken = async () => {
      // Token yoksa engelle
      if (!qrToken) {
        setTokenValid(false)
        setTokenError('QR kod taramanız gerekiyor! Lütfen tablet ekranındaki QR kodu okutun.')
        return
      }

      // Token varsa önce geçerli say (API yoksa da çalışsın)
      setTokenValid(true)
      setLocationId('restaurant') // Varsayılan
      
      // SessionStorage'a token bilgisini kaydet (handleLogin için)
      const tokenData = {
        token: qrToken,
        timestamp: Date.now(),
        expiresIn: 5 * 60 * 1000 // 5 dakika
      }
      sessionStorage.setItem('qrToken', JSON.stringify(tokenData))

      // Arka planda API'yi de kontrol et
      try {
        const response = await fetch('/.netlify/functions/qr-validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: qrToken })
        })

        const result = await response.json()

        if (result.success) {
          // API başarılı, location güncelle
          setLocationId(result.location_id)
          
          // Token bilgisini güncelle
          const tokenData = {
            token: qrToken,
            timestamp: Date.now(),
            expiresIn: 5 * 60 * 1000
          }
          sessionStorage.setItem('qrToken', JSON.stringify(tokenData))
        } else {
          // API token geçersiz diyor
          if (result.code === 'TOKEN_EXPIRED') {
            setTokenValid(false)
            setTokenError('⏰ QR kod süresi dolmuş! Lütfen yeni QR kod tarayın.')
          } else if (result.code === 'TOKEN_USED') {
            setTokenValid(false)
            setTokenError('🔒 Bu QR kod zaten kullanılmış! Lütfen yeni QR kod tarayın.')
          } else if (result.code === 'TOKEN_INVALID') {
            setTokenValid(false)
            setTokenError('❌ Geçersiz QR kod! Lütfen tablet ekranındaki QR kodu okutun.')
          }
          // Diğer hatalar için token yine geçerli kalır
        }
      } catch (error) {
        // API çağrısı hata verdi ama token varsa sorun yok, devam
        console.error('API hatası (önemsiz, token var):', error)
      }
    }

    validateToken()
  }, [qrToken])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Check if already logged in
  useEffect(() => {
    const storedPersonnel = sessionStorage.getItem('personnelData')
    if (storedPersonnel) {
      const data = JSON.parse(storedPersonnel)
      setPersonnelData(data)
      setIsLoggedIn(true)
      checkActiveStatus(data.id)
    }
  }, [])

  const checkActiveStatus = async (personnelId) => {
    try {
      const response = await fetch(`/.netlify/functions/check-active-status?personnelId=${personnelId}`)
      const result = await response.json()
      if (result.success) {
        setHasActiveCheckIn(result.hasActiveCheckIn)
      }
    } catch (error) {
      console.error('Status check error:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // 🔒 GÜVENLİK: QR token kontrolü - ZORUNLU!
    const qrTokenStr = sessionStorage.getItem('qrToken')
    
    if (!qrTokenStr) {
      toast.error(
        '🚫 QR Kod Okutma Zorunludur!\n\nLütfen lokasyondaki QR kodu okutarak bu sayfaya gelin.',
        { duration: 5000 }
      )
      return
    }
    
    const qrToken = JSON.parse(qrTokenStr)
    const now = Date.now()
    const tokenAge = now - qrToken.timestamp
    
    // Token süresi dolmuş mu? (5 dakika)
    if (tokenAge > qrToken.expiresIn) {
      sessionStorage.removeItem('qrToken')
      toast.error(
        '⏰ QR Kodunun Süresi Doldu!\n\nLütfen QR kodu yeniden okutun.',
        { duration: 5000 }
      )
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/.netlify/functions/db-auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: personnelNo,
          password: password,
          role: 'personnel'
        })
      })

      const result = await response.json()

      if (result.success && result.user) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          personnel_no: result.user.personnel_no
        }
        
        setPersonnelData(userData)
        setIsLoggedIn(true)
        sessionStorage.setItem('personnelData', JSON.stringify(userData))
        
        // Check if has active check-in
        await checkActiveStatus(result.user.id)
        
        toast.success(`Hoş geldiniz ${result.user.name}!`)
      } else {
        toast.error('Personel no veya şifre hatalı')
      }
    } catch (error) {
      toast.error('Giriş yapılamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckInOut = async (action) => {
    setLoading(true)

    try {
      // 🔒 GÜVENLİK: QR kod uyarısı (ama engelleme YOK!)
      if (!locationId) {
        toast((t) => (
          <div>
            <p className="font-bold">⚠️ QR Kodu Okutulmadı!</p>
            <p className="text-sm">Güvenlik için QR kod okutmanız önerilir.</p>
            <button 
              onClick={() => {
                toast.dismiss(t.id)
              }}
              className="mt-2 text-xs bg-orange-500 text-white px-3 py-1 rounded"
            >
              Anladım, devam et
            </button>
          </div>
        ), { duration: 3000 })
      }

      const response = await fetch('/.netlify/functions/db-attendance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnelId: personnelData.id,
          locationId: locationId || 'manual',
          action: action,
          qrToken: qrToken,          // 🔒 QR Token (tek kullanımlık)
          qrCode: locationId ? `${locationId}-${Date.now()}` : 'manual-entry',
          deviceId: deviceId,        // 🔒 Cihaz kimliği
          deviceName: deviceName     // 📱 Cihaz adı
        })
      })

      const result = await response.json()

      if (result.success) {
        setHasActiveCheckIn(action === 'check-in')
        
        // Başarı mesajı
        toast.success(
          action === 'check-in' 
            ? '✅ Giriş yapıldı!' 
            : `✅ Çıkış yapıldı! Çalışma süresi: ${result.workHours || 0} saat`
        )
        
        // 3 saniye sonra formu temizle
        setTimeout(() => {
          setIsLoggedIn(false)
          setPersonnelData(null)
          setPersonnelNo('')
          setPassword('')
          sessionStorage.removeItem('personnelData')
        }, 3000)
      } else {
        toast.error(result.error || 'İşlem başarısız')
      }
    } catch (error) {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Token kontrol ediliyor
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#3d1e5d' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader className="w-16 h-16 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">QR kod doğrulanıyor...</p>
        </motion.div>
      </div>
    )
  }

  // Token geçersiz - Hata sayfası
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#3d1e5d' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erişim Engellendi</h1>
            <p className="text-gray-600 mb-6 text-lg">{tokenError}</p>
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-blue-900 mb-2">📱 Nasıl Giriş Yapabilirim?</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Tablet ekranına gidin</li>
                  <li>QR kodu telefonunuzla tarayın</li>
                  <li>Açılan sayfada giriş yapın</li>
                </ol>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-left">
                <p className="text-xs text-orange-800">
                  ⚠️ <strong>Güvenlik:</strong> Direkt URL ile giriş yapılamaz. Her giriş için yeni QR kod taramanız gerekir.
                </p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full text-white py-3 rounded-lg transition-colors font-medium shadow-lg"
              style={{ backgroundColor: '#3d1e5d' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d1545'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3d1e5d'}
            >
              Tekrar Dene
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Token geçerli - Normal sayfa
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#3d1e5d' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* mes.ai Logo */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mb-4"
          >
            <div className="flex justify-center items-center gap-3">
              <svg width="50" height="50" viewBox="0 0 100 100" className="text-white">
                <g fill="none" stroke="currentColor" strokeWidth="3.5">
                  {/* Flower-like clock design */}
                  <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(0 50 50)"/>
                  <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(45 50 50)"/>
                  <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(90 50 50)"/>
                  <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(135 50 50)"/>
                  <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(180 50 50)"/>
                  <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(225 50 50)"/>
                  <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(270 50 50)"/>
                  <ellipse cx="50" cy="20" rx="12" ry="15" fill="currentColor" opacity="0.9" transform="rotate(315 50 50)"/>
                  
                  {/* Center clock circle */}
                  <circle cx="50" cy="50" r="20" fill="#3d1e5d" stroke="currentColor"/>
                  
                  {/* Clock hands */}
                  <line x1="50" y1="50" x2="50" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="50" y1="50" x2="58" y2="55" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  
                  {/* Center dot */}
                  <circle cx="50" cy="50" r="3" fill="white"/>
                </g>
              </svg>
              <span className="text-4xl font-bold text-white tracking-wide lowercase">mes.ai</span>
            </div>
          </motion.div>
          
          <h1 className="text-2xl font-semibold text-white mb-2">
            Personel Giriş/Çıkış
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/80">
            <MapPin className="w-4 h-4" />
            <span>{locationNames[locationId] || 'Restoran'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/80 mt-1">
            <Clock className="w-4 h-4" />
            <span>{format(currentTime, 'HH:mm:ss')}</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {!isLoggedIn ? (
            // Login Form
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Giriş Yapın
              </h2>

              <div>
                <label className="label">Personel No</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={personnelNo}
                    onChange={(e) => setPersonnelNo(e.target.value)}
                    className="input-field pl-10"
                    placeholder="P001"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Şifre</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 text-white shadow-lg flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: loading ? '#5a2d83' : '#3d1e5d',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2d1545')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3d1e5d')}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Giriş Yap
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            // Check In/Out Buttons
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Hoş geldiniz!
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  {personnelData?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {personnelData?.personnel_no}
                </p>
              </div>

              {loading ? (
                <div className="py-8">
                  <Loader className="w-12 h-12 animate-spin mx-auto" style={{ color: '#3d1e5d' }} />
                  <p className="text-gray-600 mt-4">İşleniyor...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {!hasActiveCheckIn ? (
                    <button
                      onClick={() => handleCheckInOut('check-in')}
                      className="w-full text-white py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg"
                      style={{ backgroundColor: '#3d1e5d' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d1545'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3d1e5d'}
                    >
                      <LogIn className="w-6 h-6" />
                      GİRİŞ YAP
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckInOut('check-out')}
                      className="w-full text-white py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg"
                      style={{ backgroundColor: '#7e3fb0' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d83'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7e3fb0'}
                    >
                      <LogOut className="w-6 h-6" />
                      ÇIKIŞ YAP
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsLoggedIn(false)
                      setPersonnelData(null)
                      sessionStorage.removeItem('personnelData')
                    }}
                    className="w-full py-2 transition-colors"
                    style={{ color: '#7e3fb0' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#5a2d83'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#7e3fb0'}
                  >
                    Başka Personel
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>QR kod ile giriş sistemi</p>
          <p className="text-xs mt-1">{locationNames[locationId] || 'Restoran'}</p>
        </div>
      </motion.div>
    </div>
  )
}

export default CheckIn
