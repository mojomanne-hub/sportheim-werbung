'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Ad = {
  id: string
  title: string
  file_url: string | null
  file_type: 'image' | 'video' | 'widget'
}

type Theme = 'dark' | 'light'

const palette = {
  dark: {
    page: 'bg-[#0d1220] text-gray-100',
    card: 'bg-[#161c2c] border-gray-800',
    viewer: 'bg-[#161c2c]',
    media: 'bg-black',
    muted: 'text-gray-400',
    dot: 'bg-gray-600',
  },
  light: {
    page: 'bg-gray-50 text-gray-900',
    card: 'bg-white border-gray-200',
    viewer: 'bg-white',
    media: 'bg-gray-100',
    muted: 'text-gray-500',
    dot: 'bg-gray-300',
  },
}

export default function GalleryPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [theme, setTheme] = useState<Theme>('dark')
  const touchStartX = useRef<number | null>(null)
  const viewerRef = useRef<HTMLDivElement | null>(null)

  const p = palette[theme]

  useEffect(() => {
    const saved = localStorage.getItem('gallery-theme')
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('gallery-theme', next)
  }

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

  const openAt = (index: number) => {
    setCurrentIndex(index)
    setOpenIndex(index)
  }

  const close = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    setFullscreen(false)
    setOpenIndex(null)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await viewerRef.current?.requestFullscreen?.()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const next = () => setCurrentIndex((i) => Math.min(i + 1, ads.length - 1))
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0))

  // Tastatur: Pfeiltasten zum Blättern, Escape zum Schließen
  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') close()
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

  const current = openIndex !== null ? ads[currentIndex] : null

  return (
    <div className={`min-h-screen transition-colors ${p.page}`}>
      <header className="bg-gradient-to-r from-[#1e4a8c] to-[#2f6cc4] text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center gap-5">
          <img
            src="/wappen.png"
            alt="TSV Kirchberg 1921"
            className="w-20 h-20 object-contain bg-white rounded-full p-2 shadow-lg"
          />
          <div className="flex-1">
            <p className="text-sm uppercase tracking-widest text-blue-100">TSV Kirchberg 1921</p>
            <h1 className="text-2xl md:text-3xl font-bold">Unsere Partner</h1>
            <p className="text-blue-100 text-sm mt-1">Danke an alle, die unseren Verein unterstützen</p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-2 rounded-full bg-white/15 hover:bg-white/25 text-sm font-medium"
            aria-label="Farbschema wechseln"
          >
            {theme === 'dark' ? '☀️ Hell' : '🌙 Dunkel'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && <p className={`text-center ${p.muted}`}>Lädt...</p>}

        {!loading && ads.length === 0 && (
          <p className={`text-center ${p.muted}`}>Noch keine Werbung vorhanden.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {ads.map((ad, index) => (
            <button
              key={ad.id}
              onClick={() => openAt(index)}
              className={`group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border ${p.card}`}
            >
              <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                {ad.file_type === 'video' ? (
                  <video src={ad.file_url ?? ''} className="w-full h-full object-cover" muted />
                ) : (
                  <img
                    src={ad.file_url ?? ''}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="h-1 bg-[#1e4a8c]" />
            </button>
          ))}
        </div>
      </main>

      {current && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 z-50"
          onClick={close}
        >
          <div
            ref={viewerRef}
            className={`relative overflow-hidden flex flex-col ${p.viewer} ${
              fullscreen
                ? 'w-screen h-screen rounded-none'
                : 'w-full max-w-md md:max-w-xl max-h-[92vh] rounded-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              onClick={close}
              className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-black/60 text-white text-xl flex items-center justify-center"
              aria-label="Schließen"
            >
              ×
            </button>

            <div className="flex justify-center gap-2 pt-3 pb-2">
              {ads.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-[#1e4a8c]' : p.dot
                  }`}
                />
              ))}
            </div>

            <div className={`relative flex-1 min-h-0 flex items-center justify-center ${p.media}`}>
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

              {/* Pfeile links/rechts – nur Desktop */}
              {currentIndex > 0 && (
                <button
                  onClick={prev}
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white text-xl items-center justify-center hover:bg-black/80"
                  aria-label="Zurück"
                >
                  ‹
                </button>
              )}
              {currentIndex < ads.length - 1 && (
                <button
                  onClick={next}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white text-xl items-center justify-center hover:bg-black/80"
                  aria-label="Weiter"
                >
                  ›
                </button>
              )}
            </div>

            <div className="px-4 py-2 flex items-center justify-between">
              <p className={`text-xs ${p.muted}`}>
                {currentIndex + 1} / {ads.length} · wischen oder Pfeiltasten
              </p>
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full bg-[#1e4a8c] text-white flex items-center justify-center shadow"
                aria-label="Vollbild"
              >
                {fullscreen ? '⤡' : '⤢'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}