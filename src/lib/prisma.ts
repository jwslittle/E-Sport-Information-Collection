import { PrismaClient } from '@prisma/client'

/**
 * Neon 무료 플랜 동시 연결 상한(10)을 초과하지 않도록
 * DATABASE_URL에 connection_limit=5&pool_timeout=10을 주입합니다.
 * 환경변수에 이미 파라미터가 포함된 경우 중복 추가를 방지합니다.
 */
function buildDatabaseUrl(): string {
    const base = process.env.DATABASE_URL ?? ''
    if (!base) return base
    const separator = base.includes('?') ? '&' : '?'
    const hasLimit = base.includes('connection_limit=')
    const hasTimeout = base.includes('pool_timeout=')
    let url = base
    if (!hasLimit) url += `${separator}connection_limit=5`
    if (!hasTimeout) url += `&pool_timeout=10`
    return url
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        // Vercel 서버리스 환경 최적화: 연결 수 제한 (함수 인스턴스당 1개)
        // Neon 무료 플랜의 최대 동시 연결 수(10)를 초과하지 않도록 제한
        datasources: {
            db: {
                url: buildDatabaseUrl(),
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
