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

    if (pendingPigs.length === 0 && pendingHealth.length === 0 && pendingWeight.length === 0 && pendingBreeding.length === 0) {
        // Even if no pending changes, we might want to pull latest from server?
        // Let's allow pull if we haven't synced in a while or just always pull.
        // For efficiency, maybe we only pull if no local changes? Or always.
        // Let's continue to pull.
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
              breeding_events: pendingBreeding
          },
          lastPulledAt,
        }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data = await response.json();

      // 2. Process server response using a transaction
      await db.transaction('rw', db.pigs, db.health_records, db.weight_logs, db.breeding_events, async () => {
        
        // Mark pushed PIGS as synced
        if (pendingPigs.length > 0) {
             const pendingIds = pendingPigs.map(p => p.id);
             await db.pigs.where('id').anyOf(pendingIds).modify({ syncStatus: 'synced' });
        }

        // Mark pushed HEALTH RECORDS as synced
        if (pendingHealth.length > 0) {
            const pendingHealthIds = pendingHealth.map(h => h.id);
            await db.health_records.where('id').anyOf(pendingHealthIds).modify({ syncStatus: 'synced' });
       }

        // Mark pushed WEIGHT LOGS as synced
        if (pendingWeight.length > 0) {
            const pendingIds = pendingWeight.map(w => w.id);
            await db.weight_logs.where('id').anyOf(pendingIds).modify({ syncStatus: 'synced' });
        }

        // Mark pushed BREEDING EVENTS as synced
        if (pendingBreeding.length > 0) {
            const pendingIds = pendingBreeding.map(b => b.id);
            await db.breeding_events.where('id').anyOf(pendingIds).modify({ syncStatus: 'synced' });
        }

        // Apply server updates for PIGS
        const incomingPigs = data.changes?.pigs?.updated || [];
        if (incomingPigs.length > 0) {
             const pigsToPut = incomingPigs.map(pig => ({
                 ...pig,
                 syncStatus: 'synced'
             }));
             await db.pigs.bulkPut(pigsToPut);
        }

        // Apply server updates for HEALTH RECORDS
        const incomingHealth = data.changes?.health_records?.updated || [];
        if (incomingHealth.length > 0) {
            const healthToPut = incomingHealth.map(record => ({
                ...record,
                syncStatus: 'synced'
            }));
            await db.health_records.bulkPut(healthToPut);
       }

        // Apply server updates for WEIGHT LOGS
        const incomingWeight = data.changes?.weight_logs?.updated || [];
        if (incomingWeight.length > 0) {
             const itemsToPut = incomingWeight.map(item => ({
                 ...item,
                 syncStatus: 'synced'
             }));
             await db.weight_logs.bulkPut(itemsToPut);
        }

        // Apply server updates for BREEDING EVENTS
        const incomingBreeding = data.changes?.breeding_events?.updated || [];
        if (incomingBreeding.length > 0) {
             const itemsToPut = incomingBreeding.map(item => ({
                 ...item,
                 syncStatus: 'synced'
             }));
             await db.breeding_events.bulkPut(itemsToPut);
        }
      });

      // 3. Update timestamp
      if (data.timestamp) {
        localStorage.setItem('lastPulledAt', data.timestamp);
      }

      return { success: true, count: (pendingPigs.length + pendingHealth.length + pendingWeight.length + pendingBreeding.length) };

    } catch (error) {
      console.error('Sync Error:', error);
      throw error;
    }
  },

  async getPendingCount() {
    const pigs = await db.pigs.where('syncStatus').equals('pending').count();
    const health = await db.health_records.where('syncStatus').equals('pending').count();
    const weight = await db.weight_logs.where('syncStatus').equals('pending').count();
    const breeding = await db.breeding_events.where('syncStatus').equals('pending').count();
    return pigs + health + weight + breeding;
  }
};
