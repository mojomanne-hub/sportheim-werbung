'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Ad = {
  id: string
  title: string
  file_url: string | null
  file_type: 'image' | 'video' | 'widget'
}

export default function GalleryShowPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('werbeanzeigen')
        .select('id, title, file_url, file_type')
        .eq('active', true)
        .neq('file_type', 'widget')
        .order('sort_order', { ascending: true })

      if (data) setAds(data as Ad[])
      setLoading(false)

      await supabase.from('gallery_visits').insert({})
    }
    load()
  }, [])

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const next = () => setCurrentIndex((i) => Math.min(i + 1, ads.length - 1))
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0))

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await rootRef.current?.requestFullscreen?.()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }

  // Tastatur (Desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (diff < -50) next()
    if (diff > 50) prev()
    touchStartX.current = null
  }

  const current = ads[currentIndex]

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 bg-black text-white flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Schließen: zurück zur Übersicht */}
      <Link
        href="/gallery"
        className="absolute top-3 right-3 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-2xl"
        aria-label="Zur Übersicht"
      >
        ×
      </Link>

      {/* Vollbild-Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 left-3 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
        aria-label="Vollbild"
      >
        {fullscreen ? '⤡' : '⤢'}
      </button>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-400">Lädt...</div>
      )}

      {!loading && !current && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Noch keine Werbung vorhanden.
        </div>
      )}

      {current && (
        <>
          <div className="flex-1 min-h-0 flex items-center justify-center p-2">
            {current.file_type === 'video' ? (
              <video
                key={current.id}
                src={current.file_url ?? ''}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <img
                src={current.file_url ?? ''}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Punkte unten */}
          <div className="flex justify-center gap-2 pb-4">
            {ads.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-[#2f6cc4]' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}