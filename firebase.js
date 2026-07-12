import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Load credentials from environment variable instead of a local file
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://eclipse-zone-bot-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

export const db = getDatabase(app);