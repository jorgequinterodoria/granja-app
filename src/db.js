import Dexie from 'dexie';

export const db = new Dexie('GranjaPorcinaDB');

db.version(1).stores({
  // CORE BUSINESS (Mirrors SQL + syncStatus for offline-first)
  farms: 'id, name, plan', 
  users: 'id, email, role_id',
  roles: 'id, name',
  permissions: 'id, slug',
  role_permissions: '[role_id+permission_id], role_id, permission_id',
  
  sections: 'id, name, syncStatus',
  pens: 'id, section_id, name, syncStatus',
  
  pigs: 'id, pen_id, tag_number, numero_arete, sex, sexo, stage, etapa, status, syncStatus, updated_at',
  weight_logs: 'id, pig_id, weight, date, date_measured, syncStatus',
  breeding_events: 'id, pig_id, event_type, date, syncStatus',
  health_events: 'id, pig_id, type, date, syncStatus',
  
  feed_inventory: 'id, name, cost_per_kg, current_stock, current_stock_kg, batch_code, batch_number, syncStatus',
  feed_usage: 'id, feed_id, pen_id, pig_id, date, syncStatus',
  
  access_logs: 'id, date, syncStatus',
  user_points: 'id, user_id, syncStatus',

  // SYNC QUEUE (For Offline Sync) - kept for compatibility with new approach
  sync_queue: '++id, table, type, data, status' // status: 'pending', 'synced'
});

// Helper to queue changes (kept for backward compatibility but syncStatus is primary method)
export const queueChange = async (table, type, data) => {
  await db.sync_queue.add({
    table,
    type, 
    data,
    status: 'pending',
    timestamp: Date.now()
  });
  // Trigger sync if online? handled in SyncService
};

// Hook for UUID generation (simple version)
import { v4 as uuidv4 } from 'uuid';
export const generateId = () => uuidv4();

db.version(2).stores({
  farms: 'id, name, plan', 
  users: 'id, email, role_id',
  roles: 'id, name',
  permissions: 'id, slug',
  role_permissions: '[role_id+permission_id], role_id, permission_id',
  sections: 'id, name, syncStatus',
  pens: 'id, section_id, name, syncStatus',
  pigs: 'id, pen_id, tag_number, numero_arete, sex, sexo, stage, etapa, status, entry_date, syncStatus, updated_at',
  weight_logs: 'id, pig_id, weight, date, date_measured, syncStatus',
  breeding_events: 'id, pig_id, event_type, date, syncStatus',
  health_events: 'id, pig_id, type, date, syncStatus',
  feed_inventory: 'id, name, cost_per_kg, current_stock, current_stock_kg, batch_code, batch_number, syncStatus',
  feed_usage: 'id, feed_id, pen_id, pig_id, amount_kg, date, syncStatus',
  access_logs: 'id, date, syncStatus',
  user_points: 'id, user_id, syncStatus',
  sync_queue: '++id, table, type, data, status'
}).upgrade(() => {});
