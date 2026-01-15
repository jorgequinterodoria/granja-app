import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

export function useFeeding() {
    
    // params: { mode: 'individual' | 'batch', foodId, amount, targetIds (array) }
    const registerFeeding = async ({ mode, foodId, amount, targetIds }) => {
        if (!foodId || !amount || targetIds.length === 0) {
            console.error("Missing feeding parameters");
            return { success: false, error: "Faltan parámetros" };
        }

        try {
            // 1. Check Stock
            const feedItem = await db.feed_inventory.get(foodId);
            if (!feedItem) return { success: false, error: "Alimento no encontrado" };

            // Wait, amount is TOTAL amount for the batch?
            // Yes, user prompt: "Ingresas el TOTAL de kilos servidos"
            const totalKg = parseFloat(amount);
            
            if (feedItem.current_stock_kg < totalKg) {
                return { success: false, error: `Stock insuficiente. Disponible: ${feedItem.current_stock_kg}kg` };
            }

            // 2. Calculate per-pig amount
            const amountPerPig = totalKg / targetIds.length;
            
            await db.transaction('rw', db.feed_inventory, db.feed_usage, async () => {
                // A. Create Usage Records
                const usageRecords = targetIds.map(pigId => ({
                    id: uuidv4(),
                    pig_id: pigId,
                    feed_id: foodId,
                    amount_kg: parseFloat(amountPerPig.toFixed(2)),
                    date: new Date().toISOString().split('T')[0],
                    syncStatus: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));
                await db.feed_usage.bulkAdd(usageRecords);

                // B. Deduct from Inventory (Optimistic Update)
                // IMPORTANT: We do NOT mark this as 'pending' for sync, because the backend trigger 
                // 'deduct_feed_stock' will handle the deduction on the server side when 'feed_usage' records arrive.
                // We only update locally for immediate UI consistency.
                // However, wait... if we don't mark as pending, and we reload offline, it persists. 
                // If we go online, we sync 'feed_usage'. Server updates its stock. Next sync pull specifices inventory.
                // This seems correct to avoid double deduction if we were to send an inventory update too.
                await db.feed_inventory.update(foodId, {
                    current_stock_kg: parseFloat((feedItem.current_stock_kg - totalKg).toFixed(2)),
                    // syncStatus: 'pending', // <-- INTENTIONAL: Do not sync this change explicitly
                    updated_at: new Date().toISOString()
                });
            });

            return { success: true };

        } catch (error) {
            console.error("Feeding Error:", error);
            return { success: false, error: error.message };
        }
    };

    return {
        registerFeeding
    };
}
