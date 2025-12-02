import { create } from 'zustand'
import toast from 'react-hot-toast'

export const useAttendanceStore = create((set, get) => ({
  attendances: [],
  currentQRCode: null,
  qrRefreshInterval: 90000, // 90 seconds
  isLoading: false,
  error: null,

  // QR Code generation
  generateQRCode: (locationId) => {
    const code = `${locationId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    set({ currentQRCode: code })
    return code
  },

  // Check-in/Check-out
  checkInOut: async (qrCode, personnelId, action = 'check-in') => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch('/.netlify/functions/attendance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, personnelId, action })
      })

      if (!response.ok) {
        throw new Error(`${action === 'check-in' ? 'Giriş' : 'Çıkış'} başarısız`)
      }

      const data = await response.json()
      
      // Update local state
      set(state => ({
        attendances: [...state.attendances, data.attendance],
        isLoading: false
      }))

      toast.success(`${action === 'check-in' ? 'Giriş' : 'Çıkış'} başarılı!`)
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, isLoading: false })
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  },

  // Fetch attendances
  fetchAttendances: async (filters = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const response = await fetch(`/.netlify/functions/attendance-list?${queryParams}`)

      if (!response.ok) {
        throw new Error('Kayıtlar getirilemedi')
      }

      const data = await response.json()
      set({ 
        attendances: data.attendances, 
        isLoading: false 
      })
      
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return null
    }
  },

  // Get today's attendance for a personnel
  getTodayAttendance: async (personnelId) => {
    const today = new Date().toISOString().split('T')[0]
    const attendances = get().attendances.filter(
      a => a.personnelId === personnelId && a.date.startsWith(today)
    )
    return attendances
  },

  // Calculate work hours
  calculateWorkHours: (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0
    
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffMs = end - start
    const diffHours = diffMs / (1000 * 60 * 60)
    
    return Math.round(diffHours * 100) / 100
  },

  clearError: () => set({ error: null }),
}))
