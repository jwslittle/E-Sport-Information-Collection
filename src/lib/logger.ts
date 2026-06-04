import prisma from "@/lib/prisma";

/**
 * Logs a system action to the database.
 * Usage: logAction('PREDICTION_SUBMIT', userId, { matchId: ... }, req)
 */
export async function logAction(
    action: string,
    userId?: string | null,
    details?: any,
    req?: Request
) {
    try {
        let ip = "unknown";
        let userAgent = "unknown";

        if (req) {
            ip = req.headers.get("x-forwarded-for") || "unknown";
            userAgent = req.headers.get("user-agent") || "unknown";
        }

        await prisma.systemLog.create({
            data: {
                action,
                userId: userId || null, // Ensure explicit null if undefined
                details: details || undefined, // Prisma Json handles objects
                ip,
                userAgent,
            },
        });
    } catch (error) {
        // Fail silently in production, or just log to console, to not break the main flow
        console.error(`[SystemLog Error] Failed to log action '${action}':`, error);
    }
}
