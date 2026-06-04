import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient({
        // Vercel 서버리스 환경 최적화: 연결 수 제한 (함수 인스턴스당 1개)
        // Neon 무료 플랜의 최대 동시 연결 수(10)를 초과하지 않도록 제한
        // 추가 최적화: DATABASE_URL에 ?connection_limit=5&pool_timeout=20 추가 권장
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
