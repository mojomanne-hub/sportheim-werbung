'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Script from 'next/script'

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
    <>
      <html style={{ width: '100%' }}>
        <body style={{ width: '100%', margin: 0, padding: 0, background: 'white' }}>
          <div dangerouslySetInnerHTML={{ __html: html }} style={{ pointerEvents: 'none', width: '100%' }} />
        </body>
      </html>
      
      {html.includes('fussball.de') && (
        <Script src="https://www.fussball.de/widgets.js" strategy="afterInteractive" />
      )}
    </>
  )
}