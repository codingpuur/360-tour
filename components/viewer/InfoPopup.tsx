'use client'

import { X, ExternalLink } from 'lucide-react'
import type { HotspotDoc } from '@/types'

interface InfoPopupProps {
  hotspot: HotspotDoc
  onClose: () => void
}

export function InfoPopup({ hotspot, onClose }: InfoPopupProps) {
  const { content, label } = hotspot

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

        {/* Body */}
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
            <a
              href={content.video}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <ExternalLink size={14} /> Watch video
            </a>
          )}

          {content?.link && (
            <a
              href={content.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <ExternalLink size={14} /> Learn more
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
