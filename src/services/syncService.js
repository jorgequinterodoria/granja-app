import { db } from '../db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const syncService = {
  async sync() {
    if (!navigator.onLine) return;

    // 1. Get pending changes
    const pendingPigs = await db.pigs.where('syncStatus').equals('pending').toArray();
    const pendingHealth = await db.health_records.where('syncStatus').equals('pending').toArray();
    const pendingWeight = await db.weight_logs.where('syncStatus').equals('pending').toArray();
    const pendingBreeding = await db.breeding_events.where('syncStatus').equals('pending').toArray();
    
    // Pending changes for New Modules
    const pendingFeedInv = await db.feed_inventory.where('syncStatus').equals('pending').toArray();
    const pendingFeedUsage = await db.feed_usage.where('syncStatus').equals('pending').toArray();
    const pendingAccess = await db.access_logs.where('syncStatus').equals('pending').toArray();
    const pendingPoints = await db.user_points.where('syncStatus').equals('pending').toArray();
    // Note: sanitary_zones are usually read-only or server-managed, skipping push for now unless needed.

    const allPendingCount = pendingPigs.length + pendingHealth.length + pendingWeight.length + pendingBreeding.length +
                            pendingFeedInv.length + pendingFeedUsage.length + pendingAccess.length + pendingPoints.length;

    if (allPendingCount === 0) {
        // Continue to pull
    }

    const lastPulledAt = localStorage.getItem('lastPulledAt');

    try {
      // Ensure we hit the /api/sync endpoint
      const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      
      const response = await fetch(`${baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          changes: {
              pigs: pendingPigs,
              health_records: pendingHealth,
              weight_logs: pendingWeight,
              breeding_events: pendingBreeding,
              feed_inventory: pendingFeedInv,
              feed_usage: pendingFeedUsage,
              access_logs: pendingAccess,
              user_points: pendingPoints
          },
          lastPulledAt,
        }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data = await response.json();

      // 2. Process server response using a transaction
      await db.transaction('rw', db.pigs, db.health_records, db.weight_logs, db.breeding_events, 
           db.feed_inventory, db.feed_usage, db.access_logs, db.sanitary_zones, db.user_points, async () => {
        
        // Mark pushed items as SYNCED
        const markSynced = async (table, items) => {
            if (items.length > 0) {
                const ids = items.map(i => i.id);
                await table.where('id').anyOf(ids).modify({ syncStatus: 'synced' });
            }
        };

        await markSynced(db.pigs, pendingPigs);
        await markSynced(db.health_records, pendingHealth);
        await markSynced(db.weight_logs, pendingWeight);
        await markSynced(db.breeding_events, pendingBreeding);
        
        await markSynced(db.feed_inventory, pendingFeedInv);
        await markSynced(db.feed_usage, pendingFeedUsage);
        await markSynced(db.access_logs, pendingAccess);
        await markSynced(db.user_points, pendingPoints);


        // Apply Server Updates
        const applyUpdates = async (table, updates) => {
            if (updates && updates.length > 0) {
                const itemsToPut = updates.map(item => ({...item, syncStatus: 'synced'}));
                await table.bulkPut(itemsToPut);
            }
        };

        await applyUpdates(db.pigs, data.changes?.pigs?.updated);
        await applyUpdates(db.health_records, data.changes?.health_records?.updated);
        await applyUpdates(db.weight_logs, data.changes?.weight_logs?.updated);
        await applyUpdates(db.breeding_events, data.changes?.breeding_events?.updated);
        
        await applyUpdates(db.feed_inventory, data.changes?.feed_inventory?.updated);
        await applyUpdates(db.feed_usage, data.changes?.feed_usage?.updated);
        await applyUpdates(db.access_logs, data.changes?.access_logs?.updated);
        await applyUpdates(db.sanitary_zones, data.changes?.sanitary_zones?.updated);
        await applyUpdates(db.user_points, data.changes?.user_points?.updated);

      });

      // 3. Update timestamp
      if (data.timestamp) {
        localStorage.setItem('lastPulledAt', data.timestamp);
      }

      return { success: true, count: allPendingCount };

    } catch (error) {
      console.error('Sync Error:', error);
      throw error;
    }
  },

  async getPendingCount() {
    const tables = [db.pigs, db.health_records, db.weight_logs, db.breeding_events, 
                    db.feed_inventory, db.feed_usage, db.access_logs, db.user_points];
    let total = 0;
    for (const table of tables) {
        total += await table.where('syncStatus').equals('pending').count();
    }
    return total;
  }
};
