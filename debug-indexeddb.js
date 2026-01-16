// Run this in browser console to check IndexedDB state
// Open DevTools (F12) -> Console -> Paste this code

import { db } from './db';

// Check sections
const sections = await db.sections.toArray();
console.log('📁 Sections:', sections);

// Check pens
const pens = await db.pens.toArray();
console.log('🏠 Pens:', pens);

// Check pens with section info
for (const pen of pens) {
  const section = await db.sections.get(pen.section_id);
  console.log(`Pen "${pen.name}" -> Section: ${section?.name || 'NONE'} (section_id: ${pen.section_id})`);
}

// Check sync status
const pendingPens = await db.pens.where('syncStatus').equals('pending').toArray();
console.log('⏳ Pending sync:', pendingPens.length, 'pens');
