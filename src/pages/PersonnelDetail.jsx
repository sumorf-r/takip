import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, 
  DollarSign, Clock, TrendingUp, Briefcase, Activity,
  CheckCircle, XCircle, AlertCircle, Edit3, Plus, Minus,
  Check, X, FileText, AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import toast from 'react-hot-toast'

const PersonnelDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [personnel, setPersonnel] = useState(null)
  const [stats, setStats] = useState(null)
  const [adjustments, setAdjustments] = useState([])
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState('bonus')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [processingAdjustment, setProcessingAdjustment] = useState(false)

  useEffect(() => {
    fetchPersonnelDetail()
    fetchAdjustments()
  }, [id])

  const fetchPersonnelDetail = async () => {
    try {
      const response = await fetch(`/.netlify/functions/personnel-detail?id=${id}`)
      const result = await response.json()

      if (result.success) {
        setPersonnel(result.personnel)
        // API'den gelen yapıya göre stats'i oluştur
        setStats({
          total_days: result.summary?.total_days || 0,
          total_hours: result.summary?.total_hours || 0,
          total_earnings: result.summary?.total_net_earnings || 0,
          recent_attendance: result.recentAttendance || []
        })
      } else {
        toast.error('Personel bilgileri yüklenemedi')
        navigate('/admin/personnel')
      }
    } catch (error) {
      console.error('Personnel detail error:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdjustments = async () => {
    try {
      const response = await fetch(`/.netlify/functions/get-adjustments?personnelId=${id}`)
      const result = await response.json()

      if (result.success) {
        setAdjustments(result.adjustments || [])
      }
    } catch (error) {
      console.error('Adjustments fetch error:', error)
    }
  }

  const handleAdjustmentSubmit = async () => {
    if (!adjustmentAmount || !adjustmentReason) {
      toast.error('Miktar ve sebep gerekli')
      return
    }

    setProcessingAdjustment(true)
    try {
      const response = await fetch('/.netlify/functions/salary-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnelId: id,
          attendanceId: null, // Manuel düzeltme için null
          adjustmentType: adjustmentType,
          amount: parseFloat(adjustmentAmount),
          reason: adjustmentReason,
          createdBy: localStorage.getItem('userId'),
          autoApprove: true // Admin direkt onaylıyor
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setShowAdjustmentModal(false)
        setAdjustmentAmount('')
        setAdjustmentReason('')
        fetchAdjustments()
        fetchPersonnelDetail() // İstatistikleri yenile
      } else {
        toast.error(result.error || 'İşlem başarısız')
      }
    } catch (error) {
      console.error('Adjustment error:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setProcessingAdjustment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!personnel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Personel bulunamadı</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/personnel')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Geri Dön
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Personel Detayı</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol - Personel Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Profil */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-primary-700">
                    {personnel.name[0]}{personnel.surname[0]}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {personnel.name} {personnel.surname}
                </h2>
                <p className="text-gray-600 mt-1">{personnel.position || 'Pozisyon Belirtilmemiş'}</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-3 ${
                  personnel.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {personnel.is_active ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" />
                      Pasif
                    </>
                  )}
                </span>
              </div>

              {/* İletişim Bilgileri */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
                
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">ID: {personnel.personnel_no}</span>
                </div>

                {personnel.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{personnel.email}</span>
                  </div>
                )}

                {personnel.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{personnel.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{personnel.location_name || 'Lokasyon Yok'}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{personnel.department || 'Departman Yok'}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">
                    İşe Giriş: {personnel.hire_date ? format(new Date(personnel.hire_date), 'dd MMMM yyyy', { locale: tr }) : '-'}
                  </span>
                </div>
              </div>

              {/* Maaş Bilgileri */}
              <div className="space-y-4 border-t pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Maaş Bilgileri</h3>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Aylık Maaş</p>
                  <p className="text-2xl font-bold text-green-700">
                    {Number(personnel.monthly_salary || 0).toLocaleString('tr-TR')} ₺
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Günlük</p>
                    <p className="text-lg font-bold text-blue-700">
                      {Number(personnel.daily_wage || 0).toFixed(2)} ₺
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Saatlik</p>
                    <p className="text-lg font-bold text-purple-700">
                      {Number(personnel.hourly_wage || 0).toFixed(2)} ₺
                    </p>
                  </div>
                </div>
              </div>

              {/* İzin Bilgileri */}
              <div className="space-y-4 border-t pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">İzin Durumu</h3>
                
                <div className={`rounded-lg p-4 ${personnel.on_leave ? 'bg-orange-50' : 'bg-blue-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Kalan / Toplam</p>
                    {personnel.on_leave && (
                      <span className="text-xs font-medium text-orange-600">🏖️ İzinli</span>
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${personnel.on_leave ? 'text-orange-700' : 'text-blue-700'}`}>
                    {personnel.remaining_leave_days || 0} / {personnel.monthly_leave_days || 0} gün
                  </p>
                </div>

                {personnel.on_leave && personnel.current_leave_start && (
                  <div className="text-sm text-gray-600">
                    <p>Başlangıç: {format(new Date(personnel.current_leave_start), 'dd MMMM yyyy', { locale: tr })}</p>
                    {personnel.current_leave_end && (
                      <p>Bitiş: {format(new Date(personnel.current_leave_end), 'dd MMMM yyyy', { locale: tr })}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Vardiya */}
              {personnel.shift_start_time && personnel.shift_end_time && (
                <div className="space-y-4 border-t pt-6 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Vardiya Saatleri</h3>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 font-medium">
                      {personnel.shift_start_time.substring(0, 5)} - {personnel.shift_end_time.substring(0, 5)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sağ - İstatistikler */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Gün</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.total_days || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Saat</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Number(stats?.total_hours || 0).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Kazanç</p>
                    <p className="text-2xl font-bold text-green-700">
                      {Number(stats?.total_earnings || 0).toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ücret Düzeltme/Ceza-Prim Yönetimi */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  Ücret Yönetimi
                </h3>
                <button
                  onClick={() => setShowAdjustmentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Düzeltme Ekle
                </button>
              </div>

              {/* Düzeltme Geçmişi */}
              {adjustments.length > 0 ? (
                <div className="space-y-3">
                  {adjustments.slice(0, 5).map((adj) => (
                    <div key={adj.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4" style={{
                      borderLeftColor: adj.adjustment_type === 'penalty' ? '#ef4444' : 
                                       adj.adjustment_type === 'bonus' ? '#22c55e' : 
                                       adj.adjustment_type === 'refund' ? '#3b82f6' : '#6366f1'
                    }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {adj.adjustment_type === 'penalty' && <Minus className="w-4 h-4 text-red-600" />}
                          {adj.adjustment_type === 'bonus' && <Plus className="w-4 h-4 text-green-600" />}
                          {adj.adjustment_type === 'refund' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                          {adj.adjustment_type === 'correction' && <Edit3 className="w-4 h-4 text-indigo-600" />}
                          <span className="font-medium text-gray-900 capitalize">
                            {adj.adjustment_type === 'penalty' ? 'Ceza' : 
                             adj.adjustment_type === 'bonus' ? 'Prim' : 
                             adj.adjustment_type === 'refund' ? 'İade' : 'Düzeltme'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            adj.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            adj.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {adj.status === 'approved' ? 'Onaylandı' : 
                             adj.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{adj.reason}</p>
                        <p className="text-xs text-gray-500">
                          {adj.created_at && format(new Date(adj.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          adj.adjustment_type === 'penalty' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {adj.adjustment_type === 'penalty' ? '-' : '+'}{Number(adj.amount).toFixed(2)} ₺
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Henüz düzeltme kaydı yok
                </div>
              )}
            </div>

            {/* Son Aktiviteler */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Son Aktiviteler</h3>
              
              {stats?.recent_attendance && stats.recent_attendance.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_attendance.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Activity className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.date ? format(new Date(record.date), 'dd MMMM yyyy', { locale: tr }) : '-'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.check_in ? record.check_in.substring(0, 5) : '-'} - {' '}
                            {record.check_out ? record.check_out.substring(0, 5) : 'Devam ediyor'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Çalışma</p>
                        <p className="font-bold text-gray-900">
                          {Number(record.work_hours || 0).toFixed(1)} saat
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          {Number(record.net_earnings || 0).toFixed(2)} ₺
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Henüz aktivite kaydı yok
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Düzeltme Modal */}
        {showAdjustmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Ücret Düzeltmesi</h3>
                <button
                  onClick={() => setShowAdjustmentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Düzeltme Tipi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşlem Tipi
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAdjustmentType('bonus')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        adjustmentType === 'bonus'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <Plus className={`w-6 h-6 mx-auto mb-2 ${
                        adjustmentType === 'bonus' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium">Prim/İkramiye</p>
                    </button>
                    
                    <button
                      onClick={() => setAdjustmentType('penalty')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        adjustmentType === 'penalty'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <Minus className={`w-6 h-6 mx-auto mb-2 ${
                        adjustmentType === 'penalty' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium">Ceza</p>
                    </button>

                    <button
                      onClick={() => setAdjustmentType('refund')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        adjustmentType === 'refund'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${
                        adjustmentType === 'refund' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium">İade</p>
                    </button>

                    <button
                      onClick={() => setAdjustmentType('correction')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        adjustmentType === 'correction'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <Edit3 className={`w-6 h-6 mx-auto mb-2 ${
                        adjustmentType === 'correction' ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium">Düzeltme</p>
                    </button>
                  </div>
                </div>

                {/* Miktar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miktar (₺)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sebep */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sebep / Açıklama
                  </label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Düzeltme sebebini yazın..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Uyarı */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Dikkat!</p>
                      <p>Bu işlem personelin {adjustmentType === 'penalty' ? 'ücretinden kesinti yapacak' : 'ücretine eklenecek'}. İşlem hemen uygulanacaktır.</p>
                    </div>
                  </div>
                </div>

                {/* Butonlar */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAdjustmentModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={processingAdjustment}
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleAdjustmentSubmit}
                    disabled={processingAdjustment || !adjustmentAmount || !adjustmentReason}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                      processingAdjustment || !adjustmentAmount || !adjustmentReason
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {processingAdjustment ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Onayla ve Uygula
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonnelDetail
