/**
 * POST /api/upload
 * 프로필 이미지 업로드 — Cloudinary 스토리지 사용
 *
 * Vercel 파일시스템은 읽기전용이므로 외부 스토리지 필수.
 * Cloudinary 무료 플랜: 25GB 저장 + 25GB 전송/월
 *
 * 필요 환경변수 (Vercel Dashboard에 추가 필요):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

// Cloudinary 설정
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
    // 인증 필수
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cloudinary 환경변수 확인
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('[Upload] Cloudinary 환경변수가 설정되지 않았습니다.')
        return NextResponse.json({ error: '업로드 서비스가 설정되지 않았습니다. 관리자에게 문의하세요.' }, { status: 503 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 })
        }

        // MIME 타입 검증 (GIF 제외 — XSS 위험)
        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: 'JPG, PNG, WebP 형식만 업로드 가능합니다.' },
                { status: 400 }
            )
        }

        // 파일 크기 검증
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: '파일 크기는 5MB 이하여야 합니다.' },
                { status: 400 }
            )
        }

        // File → Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Cloudinary 업로드
        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
            (resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: 'e-sport-ic/profiles',
                        // userId 기반 고정 ID → 재업로드 시 자동 덮어쓰기 (이전 이미지 자동 교체)
                        public_id: `user_${session.user.id}`,
                        overwrite: true,
                        transformation: [
                            // 얼굴 기준 400x400 크롭
                            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                            // WebP 자동 변환 + 화질 최적화
                            { format: 'webp', quality: 'auto:good' },
                        ],
                        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                    },
                    (error, result) => {
                        if (error || !result) reject(error ?? new Error('Upload failed'))
                        else resolve(result as { secure_url: string; public_id: string })
                    }
                ).end(buffer)
            }
        )

        return NextResponse.json({
            success: true,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        })

    } catch (error) {
        console.error('[Upload] Cloudinary 업로드 오류:', error)
        return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
