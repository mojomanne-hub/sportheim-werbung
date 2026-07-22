'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Ad = {
  id: string
  title: string
  file_url: string
  file_type: 'image' | 'video'
  display_seconds: number
  sort_order: number
  active: boolean
}

export default function AdminPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [seconds, setSeconds] = useState(10)
  const [file, setFile] = useState<File | null>(null)

  const fetchAds = useCallback(async () => {
    const { data } = await supabase
      .from('ads')
      .select('*')
      .order('sort_order', { ascending: true })
    if (data) setAds(data)
  }, [])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const handleUpload = async () => {
    if (!file || !title) {
      alert('Bitte Titel und Datei auswählen')
      return
    }
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const fileType: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image'

    const { error: uploadError } = await supabase.storage
      .from('ads-media')
      .upload(fileName, file)

    if (uploadError) {
      alert('Fehler beim Hochladen: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('ads-media')
      .getPublicUrl(fileName)

    const maxOrder = ads.length > 0 ? Math.max(...ads.map((a) => a.sort_order)) : 0

    const { error: insertError } = await supabase.from('ads').insert({
      title,
      file_url: urlData.publicUrl,
      file_type: fileType,
      display_seconds: seconds,
      sort_order: maxOrder + 1,
      active: true,
    })

    if (insertError) {
      alert('Fehler beim Speichern: ' + insertError.message)
    } else {
      setTitle('')
      setSeconds(10)
      setFile(null)
      fetchAds()
    }
    setUploading(false)
  }

  const toggleActive = async (ad: Ad) => {
    await supabase.from('ads').update({ active: !ad.active }).eq('id', ad.id)
    fetchAds()
  }

  const updateSeconds = async (ad: Ad, newSeconds: number) => {
    await supabase.from('ads').update({ display_seconds: newSeconds }).eq('id', ad.id)
    fetchAds()
  }

  const deleteAd = async (ad: Ad) => {
    if (!confirm(`"${ad.title}" wirklich löschen?`)) return
    await supabase.from('ads').delete().eq('id', ad.id)
    fetchAds()
  }

  const moveAd = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= ads.length) return

    const current = ads[index]
    const target = ads[targetIndex]

    await supabase.from('ads').update({ sort_order: target.sort_order }).eq('id', current.id)
    await supabase.from('ads').update({ sort_order: current.sort_order }).eq('id', target.id)
    fetchAds()
  }

  const activeCount = ads.filter((a) => a.active).length

  return (
    <div className="min-h-screen bg-[#0d1220] text-gray-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Sportheim Werbung</h1>
          <p className="text-sm text-gray-500 tracking-wide">VERWALTUNG</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 tracking-widest">WERBUNGEN</span>
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">▣</div>
            </div>
            <p className="text-3xl font-bold text-white">{ads.length}</p>
          </div>
          <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 tracking-widest">AKTIV</span>
              <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center text-green-400">✓</div>
            </div>
            <p className="text-3xl font-bold text-white">{activeCount}</p>
          </div>
        </div>

        <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-white mb-4">Neue Werbung hochladen</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0d1220] border border-gray-700 rounded-lg px-3 py-2 w-full text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Anzeigedauer (Sekunden, nur für Bilder)"
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
              className="bg-[#0d1220] border border-gray-700 rounded-lg px-3 py-2 w-full text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
            />
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-500 transition text-white px-4 py-2 rounded-lg disabled:opacity-50 font-medium"
            >
              {uploading ? 'Lädt hoch...' : 'Hochladen'}
            </button>
          </div>
        </div>

        <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Vorhandene Werbungen</h2>
            <span className="text-sm text-gray-500">{ads.length} gesamt</span>
          </div>

          {ads.length === 0 && <p className="text-gray-500 text-sm">Noch keine Werbung hochgeladen.</p>}

          <div className="space-y-2">
            {ads.map((ad, index) => (
              <div key={ad.id} className="border border-gray-800 bg-[#0d1220] rounded-lg p-3 flex items-center gap-3">
                {ad.file_type === 'image' ? (
                  <img src={ad.file_url} className="w-14 h-14 object-cover rounded-lg" />
                ) : (
                  <video src={ad.file_url} className="w-14 h-14 object-cover rounded-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-100 truncate">{ad.title}</p>
                  <p className="text-xs text-gray-500">
                    {ad.file_type === 'image' ? `${ad.display_seconds}s` : 'Video (volle Länge)'}
                  </p>
                </div>
                {ad.file_type === 'image' && (
                  <input
                    type="number"
                    value={ad.display_seconds}
                    onChange={(e) => updateSeconds(ad, Number(e.target.value))}
                    className="bg-[#161c2c] border border-gray-700 rounded-lg w-16 px-2 py-1 text-sm text-gray-100"
                  />
                )}
                <button onClick={() => moveAd(index, -1)} className="px-2 py-1 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">↑</button>
                <button onClick={() => moveAd(index, 1)} className="px-2 py-1 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">↓</button>
                <button
                  onClick={() => toggleActive(ad)}
                  className={`px-2 py-1 rounded-lg text-sm font-medium ${ad.active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700/40 text-gray-400'}`}
                >
                  {ad.active ? 'Aktiv' : 'Inaktiv'}
                </button>
                <button onClick={() => deleteAd(ad)} className="px-2 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30">
                  Löschen
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}