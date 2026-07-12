import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'node:fs';
import path from 'node:path';

let serviceAccount;

// If the environment variable exists, use it (for server deployment)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT from env:", e);
    }
} 
// Otherwise, look for the local file (for local development)
else {
    const filePath = path.resolve('./serviceAccountKey.json');
    if (fs.existsSync(filePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
        throw new Error("No Firebase credentials found!");
    }
}

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://eclipse-zone-bot-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

export const db = getDatabase(app);