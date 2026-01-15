import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

export function useGamification() {
    // Helper to add points
    const addPoints = async (reason, points = 10) => {
        try {
            await db.user_points.add({
                id: uuidv4(),
                user_id: 'current-user', // In real app, get from Auth context
                points,
                reason,
                event_date: new Date().toISOString().split('T')[0],
                syncStatus: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            console.log(`🏆 Gamification: +${points} pts for ${reason}`);
        } catch (error) {
            console.error("Error adding points:", error);
        }
    };

    // Get current week points
    const weeklyPoints = useLiveQuery(async () => {
        // Simple logic: Get all points for 'current-user' (ignoring date filter for MVP simplicity)
        const logs = await db.user_points.where('user_id').equals('current-user').toArray();
        return logs.reduce((sum, log) => sum + log.points, 0);
    });

    return {
        addPoints,
        weeklyPoints: weeklyPoints || 0
    };
}
