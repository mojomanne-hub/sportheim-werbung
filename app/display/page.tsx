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
    if (ads.length === 0) return
    const current = ads[currentIndex]
    if (!current) return

    if (current.file_type === 'image') {
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

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      {current.file_type === 'image' ? (
        <img
          key={current.id}
          src={current.file_url}
          alt={current.title}
          className="w-full h-full object-contain"
        />
      ) : (
        <video
          key={current.id}
          src={current.file_url}
          autoPlay
          muted
          onEnded={handleVideoEnded}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  )
}