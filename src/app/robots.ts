import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/onboarding', '/auth/'],
            },
        ],
        sitemap: 'https://e-sport-information-collection.vercel.app/sitemap.xml',
    }
}
