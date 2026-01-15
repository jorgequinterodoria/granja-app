import Dexie from 'dexie';

export const db = new Dexie('GranjaDatabase');

db.version(1).stores({
  pigs: 'id, syncStatus, status, updated_at'
});

db.version(2).stores({
  pigs: 'id, syncStatus, status, updated_at, numero_arete'
});

db.version(3).stores({
  health_records: 'id, pig_id, syncStatus, isDeleted, updated_at'
});

db.version(4).stores({
  weight_logs: 'id, pig_id, date_measured, syncStatus, updated_at',
  breeding_events: 'id, pig_id, event_date, syncStatus, updated_at'
});

db.version(5).stores({
  feed_inventory: 'id, name, syncStatus, updated_at',
  feed_usage: 'id, pig_id, feed_id, date, syncStatus, updated_at',
  access_logs: 'id, visitor_name, entry_time, syncStatus, updated_at',
  sanitary_zones: 'id, name', // Usually read-only or rare updates
  user_points: 'id, user_id, event_date, syncStatus, updated_at'
});
