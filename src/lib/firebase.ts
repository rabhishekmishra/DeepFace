import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with long polling for better reliability in restricted networks
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
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
