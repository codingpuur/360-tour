'use client'

import { Thermometer, Activity, Droplets, Gauge, Wind, Zap } from 'lucide-react'
import type { HotspotDoc, SensorType } from '@/types'

interface HoverCardProps {
  hotspot: HotspotDoc
  x: number
  y: number
}

const SENSOR_ICONS: Record<SensorType, React.ElementType> = {
  temperature: Thermometer,
  vibration:   Activity,
  humidity:    Droplets,
  pressure:    Gauge,
  airquality:  Wind,
  power:       Zap,
}

const STATUS_COLORS: Record<string, string> = {
  normal: 'text-green-400',
  warn:   'text-amber-400',
  danger: 'text-red-400',
}

export function HoverCard({ hotspot, x, y }: HoverCardProps) {
  const { sensor, label, content } = hotspot

  // Keep card within viewport (shift left if near right edge)
  const style: React.CSSProperties = {
    position: 'fixed',
    left: x + 14,
    top:  y - 10,
    pointerEvents: 'none',
    zIndex: 40,
    transform: 'translateY(-50%)',
  }

  if (sensor?.type) {
    const Icon        = SENSOR_ICONS[sensor.type]
    const statusColor = sensor.status ? STATUS_COLORS[sensor.status] : 'text-gray-300'

    return (
      <div style={style}
        className="bg-gray-900/95 backdrop-blur border border-white/15 rounded-xl shadow-2xl px-3 py-2.5 min-w-[110px]">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon size={11} className={statusColor} />
          <span className="text-gray-400 text-xs capitalize">{sensor.type}</span>
        </div>
        {sensor.value ? (
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold tabular-nums ${statusColor}`}>
              {sensor.value}
            </span>
            {sensor.unit && (
              <span className="text-xs text-gray-400">{sensor.unit}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-500 italic">No reading</span>
        )}
      </div>
    )
  }

  // Regular info hotspot — show label or title
  const displayText = content?.title || label
  return (
    <div style={style}
      className="bg-gray-900/95 backdrop-blur border border-white/15 rounded-lg shadow-2xl px-3 py-2">
      <p className="text-white text-xs font-medium max-w-[160px] truncate">{displayText}</p>
    </div>
  )
}
