'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WidgetPage() {
  const params = useParams()
  const id = params?.id as string
  const [html, setHtml] = useState('')
  const [scriptSrcs, setScriptSrcs] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('werbeanzeigen')
        .select('title, widget_code')
        .eq('id', id)
        .single()

      if (!data?.widget_code) return

      const code: string = data.widget_code

      const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi
      const srcs: string[] = []
      let match
      while ((match = scriptRegex.exec(code)) !== null) {
        srcs.push(match[1])
      }
      const withoutScripts = code.replace(/<script[\s\S]*?<\/script>/gi, '')

      setScriptSrcs(srcs)
      setHtml(withoutScripts)
    }
    if (id) load()
  }, [id])

  useEffect(() => {
    const loadedScripts: HTMLScriptElement[] = []

    scriptSrcs.forEach((src) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      document.body.appendChild(script)
      loadedScripts.push(script)
    })

    return () => {
      loadedScripts.forEach((s) => s.remove())
    }
  }, [scriptSrcs])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
