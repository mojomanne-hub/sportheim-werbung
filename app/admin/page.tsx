'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Ad = {
  id: string
  title: string
  file_url: string | null
  file_type: 'image' | 'video' | 'widget'
  widget_code: string | null
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
  const [touchDraggingIndex, setTouchDraggingIndex] = useState<number | null>(null)
  const [visitStats, setVisitStats] = useState<{ total: number; week: number; month: number } | null>(null)
  const [widgetTitle, setWidgetTitle] = useState('')
  const [widgetCode, setWidgetCode] = useState('')
  const [widgetSeconds, setWidgetSeconds] = useState(15)
  const [savingWidget, setSavingWidget] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

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

  const addWidget = async (title: string, code: string, seconds: number) => {
    const maxOrder = ads.length > 0 ? Math.max(...ads.map((a) => a.sort_order)) : 0

    const { error } = await supabase.from('werbeanzeigen').insert({
      title,
      file_url: null,
      file_type: 'widget',
      widget_code: code,
      display_seconds: seconds,
      sort_order: maxOrder + 1,
      active: true,
    })

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
      return false
    }
    fetchAds()
    return true
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

  const persistReorder = async (reordered: Ad[]) => {
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

    await persistReorder(reordered)
  }

  const handleItemDragEnd = () => {
    setDragOverIndex(null)
    setDraggableIndex(null)
  }

  const handleTouchStart = (index: number) => {
    setTouchDraggingIndex(index)
    setDragOverIndex(index)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLSpanElement>) => {
    if (touchDraggingIndex === null) return
    const touchY = e.touches[0].clientY

    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (touchY >= rect.top && touchY <= rect.bottom) {
        setDragOverIndex(i)
        break
      }
    }
  }

  const handleTouchEnd = async () => {
    const fromIndex = touchDraggingIndex
    const toIndex = dragOverIndex

    setTouchDraggingIndex(null)
    setDragOverIndex(null)

    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return

    const reordered = [...ads]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    await persistReorder(reordered)
  }

  const activeCount = ads.filter((a) => a.active).length

  return (
    <div className="min-h-screen bg-[#0d1220] text-gray-100 p-2 sm:p-6 md:p-10">
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

      <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-5 mb-6">
  <h2 className="font-semibold text-white mb-1">Baustein hinzufügen</h2>
  <p className="text-gray-500 text-xs mb-4">
    Für Widgets, Links (Spiele, Tabellen), etc.
  </p>
  <div className="space-y-3">
    <input
      type="text"
      placeholder="Titel (z.B. 'Spiel gegen Bad Schussenried')"
      value={widgetTitle}
      onChange={(e) => setWidgetTitle(e.target.value)}
      className="bg-[#0d1220] border border-gray-700 rounded-lg px-3 py-2 w-full text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
    />
    <textarea
      placeholder="Einbettungscode ODER Link-URL (z.B. https://...)"
      value={widgetCode}
      onChange={(e) => setWidgetCode(e.target.value)}
      rows={4}
      className="bg-[#0d1220] border border-gray-700 rounded-lg px-3 py-2 w-full text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
    />
    <input
      type="number"
      placeholder="Anzeigedauer in Sekunden"
      value={widgetSeconds}
      onChange={(e) => setWidgetSeconds(Number(e.target.value))}
      className="bg-[#0d1220] border border-gray-700 rounded-lg px-3 py-2 w-full text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
    />
    <button
      onClick={async () => {
        if (!widgetTitle || !widgetCode) {
          alert('Bitte Titel und Code/Link angeben')
          return
        }
        
        // Wenn es ein Link ist (mit http/https), wrappen wir ihn in einen iframe-Code
        let finalCode = widgetCode
        if (widgetCode.startsWith('http')) {
          finalCode = `<iframe src="${widgetCode}" width="100%" height="100%" frameborder="0" style="border: none; width: 100vw; height: 100vh;"></iframe>`
        }
        
        setSavingWidget(true)
        const ok = await addWidget(widgetTitle, finalCode, widgetSeconds)
        if (ok) {
          setWidgetTitle('')
          setWidgetCode('')
          setWidgetSeconds(15)
        }
        setSavingWidget(false)
      }}
      disabled={savingWidget}
      className="bg-purple-600 hover:bg-purple-500 transition text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 w-full"
    >
      {savingWidget ? 'Speichert...' : 'Baustein hinzufügen'}
    </button>
  </div>
</div>

        <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-2 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Vorhandene Werbungen & Bausteine</h2>
            <span className="text-sm text-gray-500">{ads.length} gesamt · am Griff ⠿ ziehen zum Sortieren</span>
          </div>

          {ads.length === 0 && <p className="text-gray-500 text-sm">Noch keine Werbung oder Bausteine hinzugefügt.</p>}

          <div className="space-y-2">
            {ads.map((ad, index) => (
              <div
                key={ad.id}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                draggable={draggableIndex === index}
                onDragStart={(e) => handleItemDragStart(e, index)}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDrop={(e) => handleItemDrop(e, index)}
                onDragEnd={handleItemDragEnd}
                className={`border rounded-lg p-2 flex flex-wrap items-center gap-2 transition ${
                  dragOverIndex === index ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 bg-[#0d1220]'
                }`}
              >
                <span
                  onMouseDown={() => handleHandleMouseDown(index)}
                  onTouchStart={() => handleTouchStart(index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ touchAction: 'none' }}
                  className="text-gray-500 select-none cursor-move text-xl px-2 py-1"
                  title="Ziehen zum Sortieren"
                >
                  ⠿
                </span>
                
                {ad.file_type === 'image' ? (
                  <button
                    onClick={() => setSelectedImageUrl(ad.file_url)}
                    className="w-14 h-14 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition flex-shrink-0"
                    title="Klick für Vorschau"
                  >
                    <img src={ad.file_url ?? ''} className="w-full h-full object-cover" alt={ad.title} />
                  </button>
                ) : ad.file_type === 'video' ? (
                  <video src={ad.file_url ?? ''} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 text-2xl flex-shrink-0">
                    ◫
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-100 truncate">{ad.title}</p>
                  <p className="text-xs text-gray-500">
                    {ad.file_type === 'video' ? 'Video (volle Länge)' : `${ad.display_seconds}s`}
                  </p>
                </div>
                
                {ad.file_type !== 'video' && (
                  <input
                    type="number"
                    value={ad.display_seconds}
                    onChange={(e) => updateSeconds(ad, Number(e.target.value))}
                    className="bg-[#161c2c] border border-gray-700 rounded-lg w-12 px-1 py-1 text-sm text-gray-100"
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
                  aria-label="Löschen"
                  className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bild-Vorschau Modal */}
      {selectedImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div
            className="bg-[#161c2c] rounded-xl border border-gray-700 p-4 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Bild-Vorschau</h3>
              <button
                onClick={() => setSelectedImageUrl(null)}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            <img
              src={selectedImageUrl}
              alt="Vorschau"
              className="w-full rounded-lg object-contain max-h-96"
            />
          </div>
        </div>
      )}
    </div>
  )
}