import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, Clock, TrendingUp, Loader } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const PersonnelDetailModal = ({ isOpen, onClose, personnelId }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (isOpen && personnelId) {
      fetchPersonnelDetail()
    }
  }, [isOpen, personnelId])

  const fetchPersonnelDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/.netlify/functions/personnel-detail?personnelId=${personnelId}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold">Personel Detayı</h2>
                {data && (
                  <p className="text-primary-100 mt-1">
                    {data.personnel.name} {data.personnel.surname}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {/* Kişisel Bilgiler */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Personel No</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{data.personnel.personnel_no}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm font-medium">Pozisyon</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{data.personnel.position}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      <p className="text-sm text-gray-900">{data.personnel.email || '-'}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">Telefon</span>
                      </div>
                      <p className="text-sm text-gray-900">{data.personnel.phone || '-'}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">Lokasyon</span>
                      </div>
                      <p className="text-sm text-gray-900">{data.personnel.location_name}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">İşe Giriş</span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {data.personnel.hire_date ? format(new Date(data.personnel.hire_date), 'dd MMMM yyyy', { locale: tr }) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Maaş Bilgileri */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Maaş Bilgileri
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Aylık</p>
                        <p className="font-bold text-green-700">{data.personnel.monthly_salary?.toLocaleString()} ₺</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Günlük</p>
                        <p className="font-bold text-green-700">{data.personnel.daily_wage?.toFixed(2)} ₺</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Saatlik</p>
                        <p className="font-bold text-green-700">{data.personnel.hourly_wage?.toFixed(2)} ₺</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Dakikalık</p>
                        <p className="font-bold text-green-700">{data.personnel.minute_wage?.toFixed(2)} ₺</p>
                      </div>
                    </div>
                  </div>

                  {/* 30 Günlük Özet */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Son 30 Gün Özeti
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Toplam Gün</p>
                        <p className="font-bold text-blue-700">{data.summary.total_days || 0}</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Toplam Saat</p>
                        <p className="font-bold text-blue-700">{parseFloat(data.summary.total_hours || 0).toFixed(1)} sa</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Fazla Mesai</p>
                        <p className="font-bold text-orange-700">{(parseFloat(data.summary.total_overtime_mins || 0) / 60).toFixed(1)} sa</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Geç Kalma</p>
                        <p className="font-bold text-red-700">{data.summary.total_late_mins || 0} dk</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Brüt Kazanç</p>
                        <p className="font-bold text-green-700">{parseFloat(data.summary.total_earnings || 0).toFixed(2)} ₺</p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-gray-600">Net Kazanç</p>
                        <p className="font-bold text-green-800 text-lg">{parseFloat(data.summary.total_net_earnings || 0).toFixed(2)} ₺</p>
                      </div>
                    </div>
                  </div>

                  {/* Son 10 Giriş/Çıkış */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      Son Giriş/Çıkışlar
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Tarih</th>
                            <th className="px-4 py-2 text-left">Giriş</th>
                            <th className="px-4 py-2 text-left">Çıkış</th>
                            <th className="px-4 py-2 text-left">Çalışma</th>
                            <th className="px-4 py-2 text-right">Kazanç</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {data.recentAttendance.map((att, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2">{format(new Date(att.date), 'dd MMM', { locale: tr })}</td>
                              <td className="px-4 py-2">{att.check_in || '-'}</td>
                              <td className="px-4 py-2">{att.check_out || '-'}</td>
                              <td className="px-4 py-2">{att.work_hours?.toFixed(1) || '-'} sa</td>
                              <td className="px-4 py-2 text-right font-semibold text-green-700">
                                {att.net_earnings?.toFixed(2) || '0.00'} ₺
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Veri yüklenemedi
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t">
              <button
                onClick={onClose}
                className="btn-secondary w-full"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PersonnelDetailModal
