import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader, DollarSign, Clock, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const PersonnelShiftModal = ({ isOpen, onClose, onSuccess, personnel }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    monthly_salary: '',
    standard_work_hours: '8',
    shift_start_time: '09:00',
    shift_end_time: '18:00'
  })

  useEffect(() => {
    if (personnel) {
      setFormData({
        monthly_salary: personnel.monthly_salary || '',
        standard_work_hours: personnel.standard_work_hours || '8',
        shift_start_time: personnel.shift_start_time || '09:00',
        shift_end_time: personnel.shift_end_time || '18:00'
      })
    }
  }, [personnel])

  // Otomatik hesaplamalar
  const calculateWages = () => {
    const monthly = parseFloat(formData.monthly_salary) || 0
    const workHours = parseFloat(formData.standard_work_hours) || 8
    
    const daily = monthly / 30
    const hourly = daily / workHours
    const minute = hourly / 60
    
    return {
      daily: daily.toFixed(2),
      hourly: hourly.toFixed(2),
      minute: minute.toFixed(2)
    }
  }

  const wages = calculateWages()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/.netlify/functions/personnel-update-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnelId: personnel.id,
          ...formData
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Mesai ayarları güncellendi!')
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Update shift error:', error)
      toast.error('Ayarlar güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen || !personnel) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mesai Ayarları</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {personnel.name} {personnel.surname} ({personnel.personnel_no})
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Maaş */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="label flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Aylık Maaş (TL)
                  </label>
                  <input
                    type="number"
                    name="monthly_salary"
                    value={formData.monthly_salary}
                    onChange={handleChange}
                    className="input-field text-lg font-bold"
                    placeholder="30000"
                    step="0.01"
                    required
                  />
                  
                  {/* Otomatik Hesaplamalar */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-gray-600 text-xs">Günlük</p>
                      <p className="font-bold text-green-700">{wages.daily} ₺</p>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-gray-600 text-xs">Saatlik</p>
                      <p className="font-bold text-green-700">{wages.hourly} ₺</p>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-gray-600 text-xs">Dakikalık</p>
                      <p className="font-bold text-green-700">{wages.minute} ₺</p>
                    </div>
                  </div>
                </div>

                {/* Çalışma Saatleri */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <label className="label flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Günlük Standart Çalışma Saati
                  </label>
                  <select
                    name="standard_work_hours"
                    value={formData.standard_work_hours}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="4">4 saat (Part-time)</option>
                    <option value="6">6 saat</option>
                    <option value="8">8 saat (Standart)</option>
                    <option value="10">10 saat</option>
                    <option value="12">12 saat (Uzun vardiya)</option>
                  </select>
                </div>

                {/* Vardiya Saatleri */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <label className="label flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4" />
                    Vardiya Saatleri
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-700 font-medium mb-1 block">
                        Başlangıç
                      </label>
                      <input
                        type="time"
                        name="shift_start_time"
                        value={formData.shift_start_time}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-700 font-medium mb-1 block">
                        Bitiş
                      </label>
                      <input
                        type="time"
                        name="shift_end_time"
                        value={formData.shift_end_time}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-center bg-white rounded p-2">
                    <p className="text-sm text-gray-600">
                      Vardiya: <span className="font-bold text-gray-900">
                        {formData.shift_start_time} - {formData.shift_end_time}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Bilgilendirme */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Not:</strong> Bu ayarlar değiştirildiğinde:
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                    <li>• Günlük/Saatlik/Dakikalık ücretler otomatik hesaplanır</li>
                    <li>• Fazla mesai 1.5x ücret ile hesaplanır</li>
                    <li>• Geç kalma ve erken çıkışlar dakikalık ücretten kesilir</li>
                    <li>• Değişiklikler yeni giriş/çıkışlardan itibaren geçerli olur</li>
                  </ul>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PersonnelShiftModal
