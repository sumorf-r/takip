import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password, role = 'personnel') => {
        set({ isLoading: true, error: null })
        try {
          // Simulated login - replace with actual API call
          const response = await fetch('/.netlify/functions/auth-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
          })

          if (!response.ok) {
            throw new Error('Giriş başarısız')
          }

          const data = await response.json()
          
          set({ 
            user: data.user, 
            token: data.token,
            isLoading: false 
          })

          return { success: true }
        } catch (error) {
          set({ 
            error: error.message, 
            isLoading: false 
          })
          return { success: false, error: error.message }
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
        window.location.href = '/admin/login'
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ user: null, token: null })
          return false
        }

        try {
          const response = await fetch('/.netlify/functions/auth-verify', {
            headers: { 
              'Authorization': `Bearer ${token}` 
            }
          })

          if (!response.ok) {
            throw new Error('Token geçersiz')
          }

          const data = await response.json()
          set({ user: data.user })
          return true
        } catch (error) {
          set({ user: null, token: null })
          return false
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
