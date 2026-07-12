import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'node:fs';

// Bulletproof JSON loading for ES Modules
const serviceAccount = JSON.parse(
    fs.readFileSync(new URL('./serviceAccountKey.json', import.meta.url), 'utf8')
);

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://eclipse-zone-bot-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

export const db = getDatabase(app);