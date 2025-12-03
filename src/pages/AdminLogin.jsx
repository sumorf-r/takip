import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const AdminLogin = () => {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/.netlify/functions/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password
        })
      })

      const result = await response.json()

      if (result.success) {
        // Admin bilgilerini sakla
        localStorage.setItem('adminUser', JSON.stringify({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          loginTime: new Date().toISOString()
        }))
        localStorage.setItem('adminToken', JSON.stringify({
          token: result.token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }))
        
        useAuthStore.setState({
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role
          },
          token: result.token
        })
        
        toast.success('Giriş başarılı!')
        navigate('/admin/dashboard')
      } else {
        toast.error(result.error || 'E-posta veya şifre hatalı')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Bağlantı hatası. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#3d1e5d' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mb-6"
          >
            {/* mes.ai Logo */}
            <div className="flex justify-center items-center gap-3">
              <svg width="60" height="60" viewBox="0 0 100 100" className="text-white">
                <g fill="currentColor">
                  {/* Clock flower petals */}
                  <circle cx="50" cy="15" r="8" opacity="0.9"/>
                  <circle cx="73" cy="27" r="8" opacity="0.9"/>
                  <circle cx="85" cy="50" r="8" opacity="0.9"/>
                  <circle cx="73" cy="73" r="8" opacity="0.9"/>
                  <circle cx="50" cy="85" r="8" opacity="0.9"/>
                  <circle cx="27" cy="73" r="8" opacity="0.9"/>
                  <circle cx="15" cy="50" r="8" opacity="0.9"/>
                  <circle cx="27" cy="27" r="8" opacity="0.9"/>
                  
                  {/* Center clock */}
                  <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="3"/>
                  <circle cx="50" cy="50" r="2"/>
                  {/* Clock hands */}
                  <line x1="50" y1="50" x2="50" y2="35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="50" y1="50" x2="60" y2="55" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </g>
              </svg>
              <span className="text-5xl font-bold text-white tracking-tight">mes.ai</span>
            </div>
          </motion.div>
          <p className="text-white/90 text-lg">
            Personel Takip Sistemi
          </p>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="label">E-posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="E-posta adresinizi girin"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="label">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded"
                  style={{ accentColor: '#3d1e5d' }}
                />
                <span className="text-sm text-gray-700">Beni hatırla</span>
              </label>
              <button
                type="button"
                className="text-sm font-medium transition-colors"
                style={{ color: '#3d1e5d' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#2d1545'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#3d1e5d'}
              >
                Şifremi unuttum
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-white shadow-lg"
              style={{ 
                backgroundColor: '#3d1e5d',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#2d1545')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#3d1e5d')}
            >
              {isLoading ? (
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
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">veya</span>
            </div>
          </div>

          {/* Personnel Login Link */}
          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-sm transition-colors"
              style={{ color: '#3d1e5d' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2d1545'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3d1e5d'}
            >
              ← Personel Girişi
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/70 text-sm">
          <p>© 2024 mes.ai</p>
          <p className="mt-1">Personel Takip Sistemi</p>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminLogin
