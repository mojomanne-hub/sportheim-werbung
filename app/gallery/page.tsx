'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Ad = {
  id: string
  title: string
  file_url: string
  file_type: 'image' | 'video'
  sort_order: number
  active: boolean
}

export default function GalleryPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const fetchAds = useCallback(async () => {
    const { data } = await supabase
      .from('werbeanzeigen')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    if (data) setAds(data)
  }, [])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const goNext = () => {
    setIndex((prev) => (prev + 1) % ads.length)
  }

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + ads.length) % ads.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  if (ads.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-lg p-6 text-center">
        Aktuell keine Werbung verfügbar
      </div>
    )
  }

  const current = ads[index]

  return (
    <div
      className="min-h-screen bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex-1 flex items-center justify-center relative">
        {current.file_type === 'image' ? (
          <img
            src={current.file_url}
            alt={current.title}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            key={current.id}
            src={current.file_url}
            controls
            autoPlay
            className="max-w-full max-h-full object-contain"
          />
        )}

        {current.file_type === 'image' && (
          <>
            <button onClick={goPrev} aria-label="Vorheriges Bild" className="absolute left-0 top-0 h-full w-1/3" />
            <button onClick={goNext} aria-label="Nächstes Bild" className="absolute right-0 top-0 h-full w-1/3" />
          </>
        )}
      </div>

      <div className="bg-[#0d1220] px-4 py-3 flex items-center justify-between">
        <button onClick={goPrev} className="text-white text-2xl px-4 py-2" aria-label="Zurück">‹</button>
        <div className="text-center">
          <p className="text-white text-sm font-medium truncate max-w-[60vw]">{current.title}</p>
          <p className="text-gray-500 text-xs">{index + 1} / {ads.length}</p>
        </div>
        <button onClick={goNext} className="text-white text-2xl px-4 py-2" aria-label="Weiter">›</button>
      </div>
    </div>
  )
}