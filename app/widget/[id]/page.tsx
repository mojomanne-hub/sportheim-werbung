'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WidgetPage() {
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          setError('Keine ID gefunden')
          return
        }

        const { data, error: queryError } = await supabase
          .from('werbeanzeigen')
          .select('widget_code')
          .eq('id', id)
          .single()

        if (queryError) {
          setError('Widget nicht gefunden: ' + queryError.message)
          return
        }

        if (!data?.widget_code) {
          setError('Kein Code vorhanden')
          return
        }

        // Warte kurz, dann setze den HTML direkt ins DOM (bypass React)
        setTimeout(() => {
          const container = document.getElementById('widget-container')
          if (container) {
            container.innerHTML = data.widget_code

            // Lade alle Scripts nach
            const scripts = container.querySelectorAll('script')
            scripts.forEach((oldScript) => {
              const newScript = document.createElement('script')
              newScript.src = oldScript.src
              newScript.async = true
              document.body.appendChild(newScript)
            })
          }
          setLoading(false)
        }, 100)
      } catch (err: any) {
        setError('Fehler: ' + err.message)
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Lädt...</div>
  if (error) return <div className="min-h-screen bg-white flex items-center justify-center text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-white p-6">
      <div id="widget-container" className="w-full max-w-3xl mx-auto" />
    </div>
  )
}