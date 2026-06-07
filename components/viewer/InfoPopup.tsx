'use client'

import { X, ExternalLink, Thermometer, Activity, Droplets, Gauge, Wind, Zap, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react'
import type { HotspotDoc, SensorType, SensorStatus } from '@/types'

interface InfoPopupProps {
  hotspot: HotspotDoc
  onClose: () => void
}

const SENSOR_META: Record<SensorType, { label: string; Icon: React.ElementType; color: string }> = {
  temperature: { label: 'Temperature',  Icon: Thermometer, color: 'text-orange-400' },
  vibration:   { label: 'Vibration',    Icon: Activity,    color: 'text-purple-400' },
  humidity:    { label: 'Humidity',     Icon: Droplets,    color: 'text-cyan-400'   },
  pressure:    { label: 'Pressure',     Icon: Gauge,       color: 'text-green-400'  },
  airquality:  { label: 'Air Quality',  Icon: Wind,        color: 'text-lime-400'   },
  power:       { label: 'Power',        Icon: Zap,         color: 'text-yellow-400' },
}

const STATUS_META: Record<SensorStatus, { label: string; Icon: React.ElementType; bg: string; text: string }> = {
  normal: { label: 'Normal',  Icon: CheckCircle,   bg: 'bg-green-500/20', text: 'text-green-400' },
  warn:   { label: 'Warning', Icon: AlertTriangle, bg: 'bg-amber-500/20', text: 'text-amber-400' },
  danger: { label: 'Danger',  Icon: AlertOctagon,  bg: 'bg-red-500/20',   text: 'text-red-400'   },
}

export function InfoPopup({ hotspot, onClose }: InfoPopupProps) {
  const { content, label, sensor } = hotspot
  const sensorMeta = sensor?.type ? SENSOR_META[sensor.type] : null
  const statusMeta = sensor?.status ? STATUS_META[sensor.status] : null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="font-semibold text-sm">{content?.title ?? label}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Sensor card — shown only when sensor data exists */}
        {sensorMeta && (
          <div className="mx-4 mt-4 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <sensorMeta.Icon size={16} className={sensorMeta.color} />
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {sensorMeta.label}
                </span>
              </div>
              {statusMeta && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.text}`}>
                  <statusMeta.Icon size={11} />
                  {statusMeta.label}
                </span>
              )}
            </div>

            {/* Value display */}
            {sensor?.value ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white tabular-nums">
                  {sensor.value}
                </span>
                {sensor.unit && (
                  <span className="text-base text-gray-400">{sensor.unit}</span>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No reading available</p>
            )}
          </div>
        )}

        {/* Regular content */}
        <div className="p-4 space-y-3">
          {content?.image && (
            <img
              src={content.image}
              alt={content.title ?? label}
              className="w-full rounded-lg object-cover max-h-48"
            />
          )}

          {content?.text && (
            <p className="text-sm text-gray-300 leading-relaxed">{content.text}</p>
          )}

          {content?.video && (
            <a href={content.video} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
              <ExternalLink size={14} /> Watch video
            </a>
          )}

          {content?.link && (
            <a href={content.link} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
              <ExternalLink size={14} /> Learn more
            </a>
          )}

          {/* Empty state when no content and no sensor */}
          {!sensorMeta && !content?.text && !content?.image && !content?.video && !content?.link && (
            <p className="text-gray-500 text-sm text-center py-2">No additional info</p>
          )}
        </div>
      </div>
    </div>
  )
}
