import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'

const LiveEarningsCounter = ({ attendance }) => {
  const [liveEarnings, setLiveEarnings] = useState(0)

  useEffect(() => {
    // Her 100ms'de bir güncelle (salise bazında)
    const interval = setInterval(() => {
      let totalEarnings = 0
      const now = new Date()

      attendance.forEach((record) => {
        if (!record.check_out_time && record.hourly_wage) {
          // Çalışmaya devam ediyorsa
          const checkIn = new Date(record.check_in_time)
          const workHours = (now - checkIn) / (1000 * 60 * 60) // Saat cinsinden
          totalEarnings += workHours * Number(record.hourly_wage)
        } else if (record.check_out_time && record.net_earnings) {
          // Çıkış yapmışsa net kazancını ekle
          totalEarnings += Number(record.net_earnings)
        }
      })

      setLiveEarnings(totalEarnings)
    }, 100) // 100ms = 0.1 saniye

    return () => clearInterval(interval)
  }, [attendance])

  // Hak edişi formatla
  const formattedEarnings = liveEarnings.toFixed(2)

  return (
    <div className="relative overflow-hidden p-4 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg border-2 border-emerald-200">
      {/* Animasyonlu background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-green-100/50 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 animate-bounce" />
            Canlı Hak Ediş (Bugün)
          </p>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75"></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150"></span>
          </div>
        </div>
        
        {/* Canlı sayaç */}
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-emerald-600 tabular-nums tracking-tight">
            {formattedEarnings}
          </p>
          <span className="text-xl font-bold text-emerald-500">₺</span>
        </div>
        
        <p className="text-xs text-emerald-600 mt-2 font-medium">
          ⚡ Gerçek zamanlı güncelleniyor
        </p>
      </div>

      {/* Parıltı effect */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/30 rounded-full blur-2xl"></div>
    </div>
  )
}

export default LiveEarningsCounter
