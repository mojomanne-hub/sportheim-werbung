'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Ad = {
  id: string
  title: string
  file_url: string | null
  file_type: 'image' | 'video' | 'widget'
}

export default function GalleryPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

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

  const openAt = (index: number) => {
    setCurrentIndex(index)
    setOpenIndex(index)
  }

  const close = () => setOpenIndex(null)

  const next = () => setCurrentIndex((i) => Math.min(i + 1, ads.length - 1))
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0))

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

  const current = openIndex !== null ? ads[currentIndex] : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#1e4a8c] to-[#2f6cc4] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center gap-5">
          <img
            src="/wappen.png"
            alt="TSV Kirchberg 1921"
            className="w-20 h-20 object-contain bg-white rounded-full p-2 shadow-lg"
          />
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-100">TSV Kirchberg 1921</p>
            <h1 className="text-2xl md:text-3xl font-bold">Unsere Partner</h1>
            <p className="text-blue-100 text-sm mt-1">Danke an alle, die unseren Verein unterstützen</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && <p className="text-center text-gray-500">Lädt...</p>}

        {!loading && ads.length === 0 && (
          <p className="text-center text-gray-500">Noch keine Werbung vorhanden.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ads.map((ad, index) => (
            <button
              key={ad.id}
              onClick={() => openAt(index)}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200 text-left"
            >
              <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                {ad.file_type === 'video' ? (
                  <video src={ad.file_url ?? ''} className="w-full h-full object-cover" muted />
                ) : (
                  <img
                    src={ad.file_url ?? ''}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="px-3 py-2 border-t-4 border-[#1e4a8c]">
                <p className="text-sm font-semibold text-gray-800 truncate">{ad.title}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      {current && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={close}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              onClick={close}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/60 text-white text-2xl flex items-center justify-center hover:bg-black/80"
              aria-label="Schließen"
            >
              ×
            </button>

            <div className="aspect-[3/4] bg-gray-100">
              {current.file_type === 'video' ? (
                <video
                  key={current.id}
                  src={current.file_url ?? ''}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={current.file_url ?? ''}
                  alt={current.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="px-4 py-3 text-center">
              <p className="font-semibold text-gray-800">{current.title}</p>
              <div className="flex justify-center gap-2 mt-2">
                {ads.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-[#1e4a8c]' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {currentIndex + 1} / {ads.length} · wischen zum Blättern
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}