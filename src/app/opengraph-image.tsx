import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'E-Sport Information Collection — LCK 경기 예측 리그'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
    // ✅ Noto Sans KR 폰트 로드 — 한글 깨짐 방지
    const fontData = await fetch(
        'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2'
    ).then(r => r.arrayBuffer()).catch(() => null)

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #09090b 0%, #18181b 60%, #1c1917 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: fontData ? 'NotoSansKR' : 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* 배경 장식 */}
                <div style={{
                    position: 'absolute', top: -100, right: -100,
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', bottom: -80, left: -80,
                    width: 300, height: 300, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
                }} />

                {/* 뱃지 */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(234,179,8,0.15)',
                    border: '1px solid rgba(234,179,8,0.4)',
                    borderRadius: 24, padding: '6px 20px', marginBottom: 32,
                }}>
                    <span style={{ fontSize: 14, color: '#eab308', letterSpacing: 2, fontWeight: 700 }}>
                        LCK 경기 예측 리그
                    </span>
                </div>

                {/* 타이틀 */}
                <div style={{
                    fontSize: 80, fontWeight: 900, color: '#ffffff',
                    letterSpacing: -2, lineHeight: 1.1,
                    textAlign: 'center', marginBottom: 24,
                }}>
                    🏆 E-Sport IC
                </div>

                {/* 서브타이틀 */}
                <div style={{
                    fontSize: 28, color: '#a1a1aa',
                    textAlign: 'center', maxWidth: 700,
                    lineHeight: 1.6, marginBottom: 48,
                }}>
                    경기 예측 · 퀴즈 · GP 랭킹 · 코스메틱
                </div>

                {/* 태그 */}
                <div style={{ display: 'flex', gap: 12 }}>
                    {['LCK 2026', '비상업적 팬 프로젝트', 'Free to Play'].map(tag => (
                        <div key={tag} style={{
                            fontSize: 16, color: '#71717a',
                            background: 'rgba(39,39,42,0.8)',
                            border: '1px solid #3f3f46',
                            borderRadius: 8, padding: '6px 16px',
                        }}>
                            {tag}
                        </div>
                    ))}
                </div>
            </div>
        ),
        {
            ...size,
            ...(fontData ? {
                fonts: [{
                    name: 'NotoSansKR',
                    data: fontData,
                    style: 'normal',
                    weight: 400,
                }],
            } : {}),
        }
    )
}
