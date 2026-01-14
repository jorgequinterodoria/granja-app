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
