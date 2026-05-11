import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings — Return all settings as a key-value object
export async function GET() {
  try {
    const settings = await db.setting.findMany()

    const settingsMap: Record<string, string> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings — Upsert a setting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value = '' } = body

    if (!key || typeof key !== 'string' || key.trim() === '') {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      )
    }

    const setting = await db.setting.upsert({
      where: { key: key.trim() },
      update: { value: String(value) },
      create: { key: key.trim(), value: String(value) },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
