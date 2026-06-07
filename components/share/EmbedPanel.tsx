'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import type { TourDoc } from '@/types'

interface EmbedPanelProps {
  tour: TourDoc
}

export function EmbedPanel({ tour }: EmbedPanelProps) {
  const [copied,  setCopied]  = useState<'link' | 'embed' | null>(null)
  const [qrUrl,   setQrUrl]   = useState<string | null>(null)

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const shareUrl = `${appUrl}/tour/${tour.slug}`
  const embedCode = `<iframe\n  src="${appUrl}/embed/${tour.slug}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  allowfullscreen\n></iframe>`

  useEffect(() => {
    // Generate QR code on client side
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(shareUrl, { width: 256, margin: 2 }).then(setQrUrl)
    })
  }, [shareUrl])

  async function copy(text: string, type: 'link' | 'embed') {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-4 space-y-5">
      {/* Public link */}
      <div>
        <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">Share Link</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg truncate">
            {shareUrl}
          </code>
          <button
            onClick={() => copy(shareUrl, 'link')}
            className="flex-shrink-0 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="Copy link"
          >
            {copied === 'link' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} className="text-gray-400" />
          </a>
        </div>
      </div>

      {/* Embed code */}
      <div>
        <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">Embed Code</label>
        <div className="relative">
          <pre className="bg-gray-800 text-gray-300 text-xs px-3 py-2 rounded-lg overflow-x-auto">
            {embedCode}
          </pre>
          <button
            onClick={() => copy(embedCode, 'embed')}
            className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {copied === 'embed' ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
          </button>
        </div>
      </div>

      {/* QR code */}
      {qrUrl && (
        <div>
          <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">QR Code</label>
          <div className="inline-block bg-white p-2 rounded-lg">
            <img src={qrUrl} alt="QR code" width={128} height={128} />
          </div>
          <a
            href={qrUrl}
            download={`${tour.slug}-qr.png`}
            className="block mt-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Download QR
          </a>
        </div>
      )}
    </div>
  )
}
