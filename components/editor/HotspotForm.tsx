'use client'

import { useState, useEffect } from 'react'
import { X, Thermometer, Activity, Droplets, Gauge, Wind, Zap } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { HotspotDoc, SceneDoc, SensorType, SensorStatus } from '@/types'

interface HotspotFormProps {
  onClose: () => void
}

const SENSOR_TYPES: { value: SensorType; label: string; Icon: React.ElementType; unit: string }[] = [
  { value: 'temperature', label: 'Temperature', Icon: Thermometer, unit: '°C'  },
  { value: 'vibration',   label: 'Vibration',   Icon: Activity,    unit: 'Hz'  },
  { value: 'humidity',    label: 'Humidity',     Icon: Droplets,    unit: '%'   },
  { value: 'pressure',    label: 'Pressure',     Icon: Gauge,       unit: 'bar' },
  { value: 'airquality',  label: 'Air Quality',  Icon: Wind,        unit: 'AQI' },
  { value: 'power',       label: 'Power',        Icon: Zap,         unit: 'kW'  },
]

const STATUS_OPTIONS: { value: SensorStatus; label: string; color: string }[] = [
  { value: 'normal', label: 'Normal',  color: 'bg-green-500' },
  { value: 'warn',   label: 'Warning', color: 'bg-amber-500' },
  { value: 'danger', label: 'Danger',  color: 'bg-red-500'   },
]

export function HotspotForm({ onClose }: HotspotFormProps) {
  const { pendingHotspot, tour, addHotspot, setPendingHotspot, setMode } = useEditorStore()

  const [label,         setLabel]         = useState('')
  const [targetSceneId, setTargetSceneId] = useState('')
  const [title,         setTitle]         = useState('')
  const [text,          setText]          = useState('')
  const [link,          setLink]          = useState('')
  const [color,         setColor]         = useState('#60a5fa')

  // Sensor state
  const [hasSensor,    setHasSensor]    = useState(false)
  const [sensorType,   setSensorType]   = useState<SensorType>('temperature')
  const [sensorValue,  setSensorValue]  = useState('')
  const [sensorUnit,   setSensorUnit]   = useState('°C')
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('normal')

  const isNavigation = pendingHotspot?.type === 'navigation'
  const scenes: SceneDoc[] = tour?.scenes ?? []

  useEffect(() => {
    setLabel('');  setTargetSceneId(''); setTitle('')
    setText('');   setLink('');          setColor(isNavigation ? '#60a5fa' : '#34d399')
    setHasSensor(false); setSensorType('temperature'); setSensorValue('')
    setSensorUnit('°C'); setSensorStatus('normal')
  }, [pendingHotspot?.type])

  // Auto-fill default unit when sensor type changes
  useEffect(() => {
    const meta = SENSOR_TYPES.find(s => s.value === sensorType)
    if (meta) setSensorUnit(meta.unit)
  }, [sensorType])

  function handleSave() {
    if (!pendingHotspot?.position) return

    const newHotspot: HotspotDoc = {
      _id:      `hs_${Date.now()}`,
      sceneId:  pendingHotspot.sceneId ?? '',
      type:     pendingHotspot.type as 'navigation' | 'info',
      position: pendingHotspot.position,
      label:    label.trim() || (isNavigation ? 'Go here' : 'Info'),
      icon:     isNavigation ? 'arrow' : 'info',
      style:    { color },
      ...(isNavigation ? {
        targetSceneId: targetSceneId || undefined,
        targetView:    { lon: 0, lat: 0 },
      } : {
        content: {
          title: title.trim() || undefined,
          text:  text.trim()  || undefined,
          link:  link.trim()  || undefined,
        },
        ...(hasSensor ? {
          sensor: {
            type:   sensorType,
            value:  sensorValue.trim() || undefined,
            unit:   sensorUnit.trim()  || undefined,
            status: sensorStatus,
          },
        } : {}),
      }),
    }

    addHotspot(newHotspot)
    setPendingHotspot(null)
    setMode('view')
    onClose()
  }

  if (!pendingHotspot) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <h3 className="text-white font-semibold text-sm">
            {isNavigation ? 'Add Navigation Point' : 'Add Info Hotspot'}
          </h3>
          <button onClick={() => { setPendingHotspot(null); setMode('view'); onClose() }}
            className="text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Label */}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Label</label>
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder={isNavigation ? 'e.g. Enter Kitchen' : 'e.g. Temperature Sensor'}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500" />
          </div>

          {isNavigation ? (
            /* Navigation: target scene picker */
            <div>
              <label className="block text-gray-400 text-xs mb-1">Target Scene</label>
              <select value={targetSceneId} onChange={e => setTargetSceneId(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500">
                <option value="">— select scene —</option>
                {scenes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          ) : (
            <>
              {/* Info content fields */}
              <div>
                <label className="block text-gray-400 text-xs mb-1">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Link URL (optional)</label>
                <input value={link} onChange={e => setLink(e.target.value)} type="url"
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500" />
              </div>

              {/* ── Sensor section ─────────────────────────────── */}
              <div className="border border-white/10 rounded-xl overflow-hidden">
                {/* Toggle header */}
                <button
                  type="button"
                  onClick={() => setHasSensor(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm text-white font-medium">Sensor Monitoring</span>
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${hasSensor ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasSensor ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </button>

                {hasSensor && (
                  <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                    {/* Sensor type grid */}
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">Sensor Type</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {SENSOR_TYPES.map(({ value, label: lbl, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSensorType(value)}
                            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-colors border ${
                              sensorType === value
                                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}
                          >
                            <Icon size={14} />
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Value + Unit */}
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Current Value</label>
                      <div className="flex gap-2">
                        <input
                          value={sensorValue}
                          onChange={e => setSensorValue(e.target.value)}
                          placeholder="e.g. 23.5"
                          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          value={sensorUnit}
                          onChange={e => setSensorUnit(e.target.value)}
                          placeholder="Unit"
                          className="w-16 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 text-center"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">Status</label>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSensorStatus(opt.value)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              sensorStatus === opt.value
                                ? 'border-white/30 bg-white/10 text-white'
                                : 'border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Color picker */}
          {!hasSensor && (
            <div>
              <label className="block text-gray-400 text-xs mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                <span className="text-gray-400 text-xs">{color}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-4 pb-4 flex gap-2 justify-end sticky bottom-0 bg-gray-900 pt-2 border-t border-white/10">
          <button onClick={() => { setPendingHotspot(null); setMode('view'); onClose() }}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Add Hotspot
          </button>
        </div>
      </div>
    </div>
  )
}
