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
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null)
  const [visitStats, setVisitStats] = useState<{ total: number; week: number; month: number } | null>(null)

  const fetchAds = useCallback(async () => {
    const { data } = await supabase
      .from('werbeanzeigen')
      .select('*')
      .order('sort_order', { ascending: true })
    if (data) setAds(data)
  }, [])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  useEffect(() => {
    const fetchVisits = async () => {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [totalRes, weekRes, monthRes] = await Promise.all([
        supabase.from('gallery_visits').select('*', { count: 'exact', head: true }),
        supabase.from('gallery_visits').select('*', { count: 'exact', head: true }).gte('visited_at', weekAgo),
        supabase.from('gallery_visits').select('*', { count: 'exact', head: true }).gte('visited_at', monthAgo),
      ])

      if (totalRes.error) console.error('Fehler beim Laden der Besucherzahlen:', totalRes.error)

      setVisitStats({
        total: totalRes.count ?? 0,
        week: weekRes.count ?? 0,
        month: monthRes.count ?? 0,
      })
    }
    fetchVisits()
  }, [])

  const uploadSingleFile = async (file: File, sortOrder: number) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const fileType: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image'

    const { error: uploadError } = await supabase.storage
      .from('werbeanzeigen-media')
      .upload(fileName, file)

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data: urlData } = supabase.storage
      .from('werbeanzeigen-media')
      .getPublicUrl(fileName)

    const derivedTitle = file.name.replace(/\.[^/.]+$/, '')

    const { error: insertError } = await supabase.from('werbeanzeigen').insert({
      title: derivedTitle,
      file_url: urlData.publicUrl,
      file_type: fileType,
      display_seconds: 7,
      sort_order: sortOrder,
      active: true,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress({ done: 0, total: files.length })

    let maxOrder = ads.length > 0 ? Math.max(...ads.map((a) => a.sort_order)) : 0

    for (let i = 0; i < files.length; i++) {
      try {
        maxOrder += 1
        await uploadSingleFile(files[i], maxOrder)
        setUploadProgress({ done: i + 1, total: files.length })
      } catch (err: any) {
        alert(`Fehler bei "${files[i].name}": ${err.message}`)
      }
    }

    setUploading(false)
    setUploadProgress(null)
    fetchAds()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingFiles(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingFiles(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingFiles(false)
  }

  const toggleActive = async (ad: Ad) => {
    const { error } = await supabase.from('werbeanzeigen').update({ active: !ad.active }).eq('id', ad.id)
    if (error) {
      alert('Fehler beim Ändern: ' + error.message)
      return
    }
    fetchAds()
  }

  const updateSeconds = async (ad: Ad, newSeconds: number) => {
    await supabase.from('werbeanzeigen').update({ display_seconds: newSeconds }).eq('id', ad.id)
    fetchAds()
  }

  const deleteAd = async (ad: Ad) => {
    if (!confirm(`"${ad.title}" wirklich löschen?`)) return
    const { error } = await supabase.from('werbeanzeigen').delete().eq('id', ad.id)
    if (error) {
      alert('Fehler beim Löschen: ' + error.message)
      return
    }
    fetchAds()
  }

  const handleHandleMouseDown = (index: number) => {
    setDraggableIndex(index)
  }

  const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleItemDrop = async (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    const fromIndex = Number(e.dataTransfer.getData('text/plain'))
    const toIndex = index

    setDragOverIndex(null)
    setDraggableIndex(null)

    if (Number.isNaN(fromIndex) || fromIndex === toIndex) return

    const reordered = [...ads]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    setAds(reordered)

    const results = await Promise.all(
      reordered.map((ad, i) =>
        supabase.from('werbeanzeigen').update({ sort_order: i + 1 }).eq('id', ad.id)
      )
    )
    const failed = results.find((r) => r.error)

    if (failed?.error) {
      alert('Fehler beim Speichern der Reihenfolge: ' + failed.error.message)
    }

    fetchAds()
  }

  const handleItemDragEnd = () => {
    setDragOverIndex(null)
    setDraggableIndex(null)
  }

  const activeCount = ads.filter((a) => a.active).length

  return (
    <div className="min-h-screen bg-[#0d1220] text-gray-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Sportheim Werbung</h1>
          <p className="text-sm text-gray-500 tracking-wide">VERWALTUNG</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 tracking-widest">QR-SCANS</span>
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">◫</div>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-3xl font-bold text-white">{visitStats?.total ?? '–'}</p>
                <p className="text-xs text-gray-500">Gesamt</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-300">{visitStats?.month ?? '–'}</p>
                <p className="text-xs text-gray-500">30 Tage</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-300">{visitStats?.week ?? '–'}</p>
                <p className="text-xs text-gray-500">7 Tage</p>
              </div>
            </div>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`bg-[#161c2c] border-2 border-dashed rounded-xl p-8 mb-6 text-center transition ${
            isDraggingFiles ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700'
          }`}
        >
          <p className="text-gray-300 font-medium mb-1">Bilder/Videos hierher ziehen</p>
          <p className="text-gray-500 text-sm mb-4">oder klicken, um Dateien auszuwählen (mehrere möglich)</p>

          <label className="inline-block bg-blue-600 hover:bg-blue-500 transition text-white px-4 py-2 rounded-lg font-medium cursor-pointer">
            Dateien auswählen
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </label>

          {uploading && uploadProgress && (
            <p className="text-blue-400 text-sm mt-4">
              Lädt hoch... {uploadProgress.done}/{uploadProgress.total}
            </p>
          )}

          <p className="text-gray-600 text-xs mt-4">
            Titel wird automatisch aus dem Dateinamen übernommen, Anzeigedauer Standard 7s – beides danach in der Liste anpassbar.
          </p>
        </div>

        <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Vorhandene Werbungen</h2>
            <span className="text-sm text-gray-500">{ads.length} gesamt · am Griff ⠿ ziehen zum Sortieren</span>
          </div>

          {ads.length === 0 && <p className="text-gray-500 text-sm">Noch keine Werbung hochgeladen.</p>}

          <div className="space-y-2">
            {ads.map((ad, index) => (
              <div
                key={ad.id}
                draggable={draggableIndex === index}
                onDragStart={(e) => handleItemDragStart(e, index)}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDrop={(e) => handleItemDrop(e, index)}
                onDragEnd={handleItemDragEnd}
                className={`border rounded-lg p-3 flex items-center gap-3 transition ${
                  dragOverIndex === index ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 bg-[#0d1220]'
                }`}
              >
                <span
                  onMouseDown={() => handleHandleMouseDown(index)}
                  className="text-gray-500 select-none cursor-move text-lg px-1"
                  title="Ziehen zum Sortieren"
                >
                  ⠿
                </span>
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
                <button
                  onClick={() => toggleActive(ad)}
                  className={`px-2 py-1 rounded-lg text-sm font-medium ${
                    ad.active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700/40 text-gray-400'
                  }`}
                >
                  {ad.active ? 'Aktiv' : 'Inaktiv'}
                </button>
                <button
                  onClick={() => deleteAd(ad)}
                  className="px-2 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30"
                >
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