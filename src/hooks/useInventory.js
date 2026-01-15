import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

export function useInventory() {
    // 1. Get all feed items
    const inventory = useLiveQuery(() => db.feed_inventory.toArray(), []) || [];

    // 2. Add or Update Stock
    const addFeed = async (params) => {
        // params: { name, cost_per_kg, current_stock_kg, batch_number }
        try {
            await db.feed_inventory.add({
                id: uuidv4(),
                ...params,
                syncStatus: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error };
        }
    };

    const updateStock = async (id, addedAmount) => {
        try {
            const item = await db.feed_inventory.get(id);
            if (!item) return;

            const newStock = parseFloat(item.current_stock_kg) + parseFloat(addedAmount);
            await db.feed_inventory.update(id, {
                current_stock_kg: newStock,
                syncStatus: 'pending', // Explicit update should sync
                updated_at: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error };
        }
    };

    return {
        inventory,
        addFeed,
        updateStock
    };
}
