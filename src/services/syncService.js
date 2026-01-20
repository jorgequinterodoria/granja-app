import { db } from '../db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const syncService = {
  async sync() {
    if (!navigator.onLine) return;

    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found, skipping sync');
      return { success: false, count: 0 };
    }

    const toServer = {
      pigs: (r) => ({
        id: r.id,
        tag_number: r.tag_number ?? r.numero_arete,
        sex: r.sex ?? r.sexo,
        stage: r.stage ?? r.etapa,
        birth_date: r.birth_date ?? r.fecha_nacimiento,
        weight: r.weight ?? r.peso,
        pen_id: r.pen_id,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at
      }),
      weight_logs: (r) => ({
        id: r.id,
        pig_id: r.pig_id,
        weight: r.weight,
        date: r.date ?? r.date_measured,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at
      }),
      breeding_events: (r) => ({
        id: r.id,
        pig_id: r.pig_id,
        event_type: r.event_type,
        date: r.date ?? r.event_date,
        details: r.details,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at
      }),
      health_events: (r) => ({
        id: r.id,
        pig_id: r.pig_id,
        type: r.type,
        description: r.description,
        date: r.date,
        cost: r.cost,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at
      }),
      feed_inventory: (r) => ({
        id: r.id,
        name: r.name,
        cost_per_kg: r.cost_per_kg,
        current_stock: r.current_stock ?? r.current_stock_kg,
        batch_code: r.batch_code ?? r.batch_number,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at
      }),
      feed_usage: (r) => ({
        id: r.id,
        feed_id: r.feed_id,
        pen_id: r.pen_id,
        pig_id: r.pig_id,
        amount_kg: r.amount_kg,
        date: r.date,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at
      }),
      sections: (r) => ({ ...r }),
      pens: (r) => ({
        id: r.id,
        name: r.name,
        section_id: r.section_id ?? r.sectionId,
        capacity: r.capacity
      }),
      access_logs: (r) => ({ ...r }),
      user_points: (r) => ({ ...r }),
      roles: (r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        created_at: r.created_at,
        deleted_at: r.deleted_at
      }),
      role_permissions: (r) => ({
        role_id: r.role_id,
        permission_id: r.permission_id
      })
    };

    const fromServer = {
      pigs: (r) => ({
        id: r.id,
        numero_arete: r.tag_number ?? r.numero_arete,
        sexo: r.sex ?? r.sexo,
        etapa: r.stage ?? r.etapa,
        fecha_nacimiento: r.birth_date ?? r.fecha_nacimiento,
        peso: r.weight ?? r.peso,
        pen_id: r.pen_id,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at,
        father_id: r.father_id,
        mother_id: r.mother_id,
        genetics_score: r.genetics_score,
        syncStatus: 'synced'
      }),
      weight_logs: (r) => ({
        id: r.id,
        pig_id: r.pig_id,
        weight: r.weight,
        date_measured: r.date ?? r.date_measured,
        date: r.date ?? r.date_measured,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at,
        syncStatus: 'synced'
      }),
      breeding_events: (r) => ({
        id: r.id,
        pig_id: r.pig_id,
        event_type: r.event_type,
        date: r.date ?? r.event_date,
        details: r.details,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at,
        syncStatus: 'synced'
      }),
      health_events: (r) => ({
        id: r.id,
        pig_id: r.pig_id,
        type: r.type,
        description: r.description,
        date: r.date,
        cost: r.cost,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at,
        syncStatus: 'synced'
      }),
      feed_inventory: (r) => ({
        id: r.id,
        name: r.name,
        cost_per_kg: r.cost_per_kg,
        current_stock_kg: r.current_stock ?? r.current_stock_kg,
        batch_number: r.batch_code ?? r.batch_number,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at,
        syncStatus: 'synced'
      }),
      feed_usage: (r) => ({
        id: r.id,
        feed_id: r.feed_id,
        pen_id: r.pen_id,
        pig_id: r.pig_id,
        amount_kg: r.amount_kg,
        date: r.date,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at,
        syncStatus: 'synced'
      }),
      sections: (r) => ({ ...r, syncStatus: 'synced' }),
      pens: (r) => ({ ...r, syncStatus: 'synced' }),
      access_logs: (r) => ({ ...r, syncStatus: 'synced' }),
      user_points: (r) => ({ ...r, syncStatus: 'synced' }),
      roles: (r) => ({ ...r, syncStatus: 'synced' }),
      role_permissions: (r) => ({ ...r, syncStatus: 'synced' })
    };

    // 1. Get pending changes
    const pendingSections = await db.sections.where('syncStatus').equals('pending').toArray();
    const pendingPens = await db.pens.where('syncStatus').equals('pending').toArray();
    const pendingPigs = await db.pigs.where('syncStatus').equals('pending').toArray();
    const pendingHealth = await db.health_events.where('syncStatus').equals('pending').toArray();
    const pendingWeight = await db.weight_logs.where('syncStatus').equals('pending').toArray();
    const pendingBreeding = await db.breeding_events.where('syncStatus').equals('pending').toArray();
    
    // Pending changes for New Modules
    const pendingFeedInv = await db.feed_inventory.where('syncStatus').equals('pending').toArray();
    const pendingFeedUsage = await db.feed_usage.where('syncStatus').equals('pending').toArray();
    const pendingAccess = await db.access_logs.where('syncStatus').equals('pending').toArray();
    const pendingPoints = await db.user_points.where('syncStatus').equals('pending').toArray();
    const pendingRoles = await db.roles.where('syncStatus').equals('pending').toArray();
    const pendingRolePerms = await db.role_permissions.where('syncStatus').equals('pending').toArray();

    const allPendingCount = pendingSections.length + pendingPens.length + pendingPigs.length + 
                            pendingHealth.length + pendingWeight.length + pendingBreeding.length +
                            pendingFeedInv.length + pendingFeedUsage.length + pendingAccess.length + pendingPoints.length +
                            pendingRoles.length + pendingRolePerms.length;

    console.log('🔄 Syncing', allPendingCount, 'pending changes...');

    const lastPulledAt = localStorage.getItem('lastPulledAt');

    try {
      const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      
      const pensPayload = await Promise.all(pendingPens.map(async (r) => {
        let section_name = null;
        const secId = r.section_id ?? r.sectionId;
        if (secId != null) {
          const sec = await db.sections.get(secId);
          section_name = sec?.name ?? null;
        }
        return {
          id: r.id,
          name: r.name,
          section_id: r.section_id ?? r.sectionId,
          section_name,
          capacity: r.capacity,
          created_at: r.created_at,
          updated_at: r.updated_at,
          deleted_at: r.deleted_at
        };
      }));

      const response = await fetch(`${baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          changes: {
              sections: pendingSections.map(toServer.sections),
              pens: pensPayload,
              pigs: pendingPigs.map(toServer.pigs),
              health_events: pendingHealth.map(toServer.health_events),
              weight_logs: pendingWeight.map(toServer.weight_logs),
              breeding_events: pendingBreeding.map(toServer.breeding_events),
              feed_inventory: pendingFeedInv.map(toServer.feed_inventory),
              feed_usage: pendingFeedUsage.map(toServer.feed_usage),
              access_logs: pendingAccess.map(toServer.access_logs),
              user_points: pendingPoints.map(toServer.user_points),
              roles: pendingRoles.map(toServer.roles),
              role_permissions: pendingRolePerms.map(toServer.role_permissions)
          },
          lastPulledAt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sync failed:', response.status, errorText);
        throw new Error('Sync failed');
      }

      const data = await response.json();
      console.log('✅ Sync successful:', data);

      // 2. Process server response using a transaction
      await db.transaction('rw', db.sections, db.pens, db.pigs, db.health_events, db.weight_logs, db.breeding_events, 
           db.feed_inventory, db.feed_usage, db.access_logs, db.user_points, db.roles, db.role_permissions, db.permissions, async () => {
        
        // Mark pushed items as SYNCED
        const markSynced = async (table, items) => {
            if (items.length > 0) {
                const ids = items.map(i => i.id);
                await table.where('id').anyOf(ids).modify({ syncStatus: 'synced' });
            }
        };

        await markSynced(db.sections, pendingSections);
        await markSynced(db.pens, pendingPens);
        await markSynced(db.pigs, pendingPigs);
        await markSynced(db.health_events, pendingHealth);
        await markSynced(db.weight_logs, pendingWeight);
        await markSynced(db.breeding_events, pendingBreeding);
        
        await markSynced(db.feed_inventory, pendingFeedInv);
        await markSynced(db.feed_usage, pendingFeedUsage);
        await markSynced(db.access_logs, pendingAccess);
        await markSynced(db.user_points, pendingPoints);
        await markSynced(db.roles, pendingRoles);
        await markSynced(db.role_permissions, pendingRolePerms);


        // Apply Server Updates
        const mergeByNameAndPut = async (table, updates) => {
            if (updates && updates.length > 0) {
                for (const item of updates) {
                    if (item.deleted_at && item.id) {
                        await table.delete(item.id);
                        continue;
                    }

                    if (!item?.name) continue;
                    const existing = await table.where('name').equals(item.name).toArray();
                    const toDelete = existing.filter(e => e.id !== item.id).map(e => e.id);
                    if (toDelete.length) {
                        // Remap foreign keys before deletion
                        if (table === db.sections) {
                            for (const oldId of toDelete) {
                                await db.pens.where('section_id').equals(oldId).modify({ section_id: item.id });
                            }
                        }
                        if (table === db.pens) {
                            for (const oldId of toDelete) {
                                await db.pigs.where('pen_id').equals(oldId).modify({ pen_id: item.id });
                                await db.feed_usage.where('pen_id').equals(oldId).modify({ pen_id: item.id });
                            }
                        }
                        await table.where('id').anyOf(toDelete).delete();
                    }
                    await table.put(item);
                }
            }
        };

        const applyUpdates = async (table, updates) => {
            if (updates && updates.length > 0) {
                const toDelete = [];
                const toPut = [];
                
                updates.forEach(item => {
                    if (item.deleted_at && item.id) {
                        toDelete.push(item.id);
                    } else {
                        toPut.push(item);
                    }
                });

                if (toDelete.length > 0) {
                    await table.bulkDelete(toDelete);
                }
                if (toPut.length > 0) {
                    await table.bulkPut(toPut);
                }
            }
        };

        await mergeByNameAndPut(db.sections, (data.changes?.sections?.updated || []).map(fromServer.sections));
        await mergeByNameAndPut(db.pens, (data.changes?.pens?.updated || []).map(fromServer.pens));
        await applyUpdates(db.pigs, (data.changes?.pigs?.updated || []).map(fromServer.pigs));
        await applyUpdates(db.health_events, (data.changes?.health_events?.updated || []).map(fromServer.health_events));
        await applyUpdates(db.weight_logs, (data.changes?.weight_logs?.updated || []).map(fromServer.weight_logs));
        await applyUpdates(db.breeding_events, (data.changes?.breeding_events?.updated || []).map(fromServer.breeding_events));
        
        await applyUpdates(db.feed_inventory, (data.changes?.feed_inventory?.updated || []).map(fromServer.feed_inventory));
        await applyUpdates(db.feed_usage, (data.changes?.feed_usage?.updated || []).map(fromServer.feed_usage));
        await applyUpdates(db.access_logs, (data.changes?.access_logs?.updated || []).map(fromServer.access_logs));
        await applyUpdates(db.user_points, (data.changes?.user_points?.updated || []).map(fromServer.user_points));
        await applyUpdates(db.roles, (data.changes?.roles?.updated || []).map(fromServer.roles));
        await applyUpdates(db.role_permissions, (data.changes?.role_permissions?.updated || []).map(fromServer.role_permissions));

        // Read-only tables
        if (data.changes?.permissions?.updated) {
            await db.permissions.bulkPut(data.changes.permissions.updated);
        }

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
    const tables = [db.sections, db.pens, db.pigs, db.health_events, db.weight_logs, db.breeding_events, 
                    db.feed_inventory, db.feed_usage, db.access_logs, db.user_points, db.roles, db.role_permissions];
    let total = 0;
    for (const table of tables) {
        total += await table.where('syncStatus').equals('pending').count();
    }
    return total;
  }
};
