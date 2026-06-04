import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 허용된 이미지 MIME 타입 (확장자 위조 방지를 위해 Content-Type 기반 검증)
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_EXTS  = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
    // 로그인 필수 — 미인증 요청 즉시 차단
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
        }

        // MIME 타입 검증 (이미지만 허용)
        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: '이미지 파일만 업로드 가능합니다. (JPG, PNG, WebP, GIF)' },
                { status: 400 }
            )
        }

        // 파일 크기 제한 (5 MB)
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: '파일 크기는 5MB 이하여야 합니다.' },
                { status: 400 }
            )
        }

        // 확장자 이중 검증
        const ext = path.extname(file.name).toLowerCase()
        if (!ALLOWED_EXTS.has(ext)) {
            return NextResponse.json(
                { error: '허용되지 않는 파일 형식입니다.' },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${uuidv4()}${ext}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')

        await mkdir(uploadDir, { recursive: true })
        const filepath = path.join(uploadDir, filename)
        await writeFile(filepath, buffer)

        return NextResponse.json({ url: `/uploads/${filename}` })
    } catch (error) {
        console.error('Upload failed:', error)
        return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 })
    }
}
