import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Prevent multiple initializations which can cause "Pending promise was never set" errors
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Explicitly use the firestoreDatabaseId from config
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

// Initialize if not already done, otherwise get existing
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, databaseId);
} catch (e) {
  dbInstance = getFirestore(app, databaseId);
}
export const db = dbInstance;

export const auth = getAuth(app);
// Ensure we don't have multiple listeners if this module re-runs
auth.useDeviceLanguage();
export const googleProvider = new GoogleAuthProvider();

// Connection test with a delayed retry to allow DB initialization
async function testConnection() {
  setTimeout(async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection established.");
    } catch (error: any) {
      // We ignore permission-denied errors here as they actually confirm connectivity
      if (error?.code !== 'permission-denied') {
        console.warn("Firestore connectivity check: Waiting for backend sync...");
      }
    }
  }, 3000);
}
testConnection();
