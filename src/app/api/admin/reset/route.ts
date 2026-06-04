import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ADMIN_EMAIL } from '@/lib/config/admin'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // Strict Admin Check
    const isAdmin = (session?.user as any)?.role === 'ADMIN'
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log(`--- Admin Initiated: FULL USER RESET by ${session?.user?.email} ---`)

        const adminEmail = ADMIN_EMAIL

        // Count users before deletion for logging
        const totalUsers = await prisma.user.count()

        // Delete all users except Admin
        // Note: Due to 'onDelete: Cascade' in schema, this should wipe:
        // - Accounts, Sessions
        // - UserTeams (Real/Sim)
        // - UserInventory
        // - MatchPredictions
        // - SystemLogs (if userId is linked, wait SystemLog userId is optional? schema check recommended)

        // Wait, SystemLog userId is String? but no foreign key relation defined in my snippet earlier?
        // Let's check schema again? 
        // Earlier I wrote: model SystemLog { ... userId String? ... } without @relation.
        // So SystemLogs will persist with 'userId' string remaining but user gone. That's actually fine for audit.

        const deleteResult = await prisma.user.deleteMany({
            where: {
                email: {
                    not: adminEmail
                }
            }
        })

        console.log(`Deleted ${deleteResult.count} users.`)

        return NextResponse.json({
            success: true,
            message: `User reset successful. Deleted ${deleteResult.count} users.`,
            deletedCount: deleteResult.count
        })

    } catch (error: any) {
        console.error('User Reset Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
