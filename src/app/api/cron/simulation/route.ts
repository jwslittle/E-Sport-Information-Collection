import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({ message: 'Cron job not yet implemented for new engine' })
}
