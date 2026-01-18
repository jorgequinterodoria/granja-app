import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export const useInventory = () => {
  const inventory = useLiveQuery(() => db.feed_inventory.toArray()) || [];

  const addStock = async (name, cost, amount, batchCode) => {
    const id = crypto.randomUUID(); // ensure UUID
    const data = {
      id,
      name,
      cost_per_kg: parseFloat(cost),
      current_stock_kg: parseFloat(amount),
      batch_number: batchCode,
      syncStatus: 'pending', // Mark for sync
      updated_at: new Date().toISOString()
    };
    
    await db.feed_inventory.add(data);
  };

  const recordConsumption = async (feedId, amount, pigId = null, penId = null) => {
    // 1. Update Inventory Stock
    const item = await db.feed_inventory.get(parseInt(feedId) || feedId);
    if (!item) throw new Error('Feed item not found');

    const newStock = (item.current_stock_kg ?? item.current_stock) - amount;
    if (newStock < 0) throw new Error('Not enough stock');

    await db.feed_inventory.update(item.id, { 
      current_stock_kg: newStock,
      syncStatus: 'pending',
      updated_at: new Date().toISOString()
    });

    // 2. Log Usage
    const usageId = crypto.randomUUID();
    const usageData = {
      id: usageId,
      feed_id: item.id,
      pen_id: penId,
      pig_id: pigId,
      amount_kg: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      syncStatus: 'pending'
    };

    await db.feed_usage.add(usageData);
  };

  const updateItem = async (id, updates) => {
    await db.feed_inventory.update(id, {
        ...updates,
        syncStatus: 'pending',
        updated_at: new Date().toISOString()
    });
  };

  return { inventory, addStock, recordConsumption, updateItem };
};
