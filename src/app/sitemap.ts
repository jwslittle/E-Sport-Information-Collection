import { MetadataRoute } from 'next'

const BASE = 'https://e-sport-information-collection.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()

    // 정적 공개 페이지
    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
        { url: `${BASE}/matches`,       lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
        { url: `${BASE}/players`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${BASE}/ranking`,       lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
        { url: `${BASE}/community`,     lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
        { url: `${BASE}/prediction`,    lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
        { url: `${BASE}/shop`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
        { url: `${BASE}/quiz`,          lastModified: now, changeFrequency: 'daily',   priority: 0.6 },
        { url: `${BASE}/rules`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE}/quests`,        lastModified: now, changeFrequency: 'daily',   priority: 0.6 },
        { url: `${BASE}/info`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
        { url: `${BASE}/info/records`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
        { url: `${BASE}/analyst`,       lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${BASE}/privacy`,       lastModified: new Date('2026-06-08'), changeFrequency: 'monthly', priority: 0.2 },
        { url: `${BASE}/terms`,         lastModified: new Date('2026-06-08'), changeFrequency: 'monthly', priority: 0.2 },
    ]

    return staticPages
}
