'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'up'

type Ad = {
  id: string
  title: string
  file_url: string | null
  file_type: 'image' | 'video' | 'widget'
  widget_code: string | null
  display_seconds: number
  sort_order: number
  active: boolean
  transition: TransitionType | null
}

const TRANSITIONS: TransitionType[] = ['none', 'fade', 'slide', 'zoom', 'up']

// Übergang sicher auswählen, unbekannte Werte fallen auf "fade" zurück
const getTransition = (value: string | null | undefined): TransitionType => {
  return TRANSITIONS.includes(value as TransitionType) ? (value as TransitionType) : 'fade'
}

// CSS-Animationen für das Einblenden
const transitionStyles = `
  @keyframes tIn-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes tIn-slide {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes tIn-zoom {
    from { transform: scale(1.15); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes tIn-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`

export default function DisplayPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

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

    const channel = supabase
      .channel('ads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'werbeanzeigen' }, () => {
        fetchAds()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAds])

  useEffect(() => {
    let wakeLock: any = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.log('Wake Lock nicht verfügbar:', err)
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) wakeLock.release()
    }
  }, [])

  useEffect(() => {
    if (ads.length === 0) return
    const current = ads[currentIndex]
    if (!current) return

    if (current.file_type !== 'video') {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length)
      }, current.display_seconds * 1000)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, ads])

  useEffect(() => {
    if (currentIndex >= ads.length) setCurrentIndex(0)
  }, [ads, currentIndex])

  const handleVideoEnded = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length)
  }

  if (ads.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white text-2xl">
        Keine Werbung vorhanden
      </div>
    )
  }

  const current = ads[currentIndex]
  const transition = getTransition(current.transition)
  // Übergang läuft jedes Mal neu, weil der Wrapper per key gewechselt wird
  const animation = transition === 'none' ? undefined : `tIn-${transition} 0.8s ease-out`

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <style>{transitionStyles}</style>
      <div
        key={current.id}
        className="w-full h-full flex items-center justify-center"
        style={{ animation }}
      >
        {current.file_type === 'widget' ? (
          <iframe
            src={`/widget/${current.id}`}
            className="w-full h-full border-0"
            title={current.title}
          />
        ) : current.file_type === 'image' ? (
          <img
            src={current.file_url ?? ''}
            alt={current.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            src={current.file_url ?? ''}
            autoPlay
            muted
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  )
}
