import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import localFirebaseConfig from '../firebase-applet-config.json';

// Support Vercel and other production environments getting config from environment variables easily or falling back to the local json file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localFirebaseConfig.projectId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localFirebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || localFirebaseConfig.measurementId || "",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export function getUserDocId(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Centrally synchronizes a custom email-password credential with Firebase Authentication.
 * If the user does not exist in Firebase Auth yet, it on-the-fly provisions/registers them
 * with the same login password, maintaining absolute security and populating the auth token.
 */
export async function syncFirebaseAuthWithEmailPassword(emailStr: string, passwordStr: string): Promise<boolean> {
  const cleanEmail = emailStr.trim().toLowerCase();
  const cleanPassword = passwordStr.trim();
  if (!cleanEmail || !cleanPassword) return false;

  try {
    console.log("[Auth Sync] Attempting Firebase Auth sign-in for:", cleanEmail);
    await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    console.log("[Auth Sync] Succeeded signing into Firebase Auth.");
    return true;
  } catch (error: any) {
    const code = error?.code || '';
    console.warn("[Auth Sync] Sign-in error code:", code, error);

    // If the user hasn't been created in Firebase Auth module yet but exists in Firestore list
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      try {
        console.log("[Auth Sync] User not in Auth register. Auto-provisioning on the fly...");
        await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        console.log("[Auth Sync] Auto-provisioned & signed in successfully!");
        return true;
      } catch (createErr: any) {
        console.error("[Auth Sync] Failed to auto-provision user in Firebase Auth:", createErr);
      }
    } else if (code === 'auth/wrong-password') {
      console.warn("[Auth Sync] Wrong password on Firebase Auth. The user typed a different password.");
    } else {
      console.warn("[Auth Sync] Sincronização em segundo plano concluída (modo anônimo mantido).");
    }
    return false;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Disable the default connection checker script to prevent permission-denied errors on startup before authentication is fully complete.
// async function testConnection() {
//   try {
//     await getDocFromServer(doc(db, 'test', 'connection'));
//   } catch (error) {
//     if (error instanceof Error && error.message.includes('the client is offline')) {
//       console.error("Please check your Firebase configuration.");
//     }
//   }
// }
// testConnection();
