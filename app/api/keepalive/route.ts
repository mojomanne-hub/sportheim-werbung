import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Wird täglich von Vercel Cron aufgerufen und hält das Supabase-Projekt aktiv.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Optional abgesichert: Vercel sendet CRON_SECRET als Bearer-Token
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { error } = await supabase
    .from('werbeanzeigen')
    .select('id')
    .limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, time: new Date().toISOString() })
}
