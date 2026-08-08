'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WidgetPage() {
  const params = useParams()
  const id = params?.id as string
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const { data } = await supabase
          .from('werbeanzeigen')
          .select('widget_code')
          .eq('id', id)
          .single()

        if (data?.widget_code) {
          setHtml(data.widget_code)
        }
      } catch (err) {
        console.error('Widget Fehler:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Lädt...</div>
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}