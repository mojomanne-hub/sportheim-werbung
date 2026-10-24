'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Ad = {
  id: string
  title: string
  file_url: string | null
  file_type: 'image' | 'video' | 'widget'
}

export default function GalleryPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [selected, setSelected] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)

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

      // Besuch protokollieren
      await supabase.from('gallery_visits').insert({})
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner mit Vereinsfarben */}
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

      {/* Kachel-Raster */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && <p className="text-center text-gray-500">Lädt...</p>}

        {!loading && ads.length === 0 && (
          <p className="text-center text-gray-500">Noch keine Werbung vorhanden.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <button
              key={ad.id}
              onClick={() => setSelected(ad)}
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

      {/* Vollbild-Ansicht */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white text-3xl hover:text-blue-300"
              aria-label="Schließen"
            >
              ×
            </button>
            {selected.file_type === 'video' ? (
              <video src={selected.file_url ?? ''} controls autoPlay className="w-full rounded-xl" />
            ) : (
              <img src={selected.file_url ?? ''} alt={selected.title} className="w-full rounded-xl object-contain max-h-[85vh]" />
            )}
            <p className="text-center text-white mt-3 font-medium">{selected.title}</p>
          </div>
        </div>
      )}

      <footer className="text-center text-xs text-gray-400 pb-8">
        Sportheim TSV Kirchberg 1921
      </footer>
    </div>
  )
}