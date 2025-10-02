import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from 'firebase/auth';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseApp() {
  if (!app) {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    } as const;
    app = getApps()[0] || initializeApp(config);
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(getFirebaseAuth(), provider);
}

export async function signOutFirebase() {
  return await signOut(getFirebaseAuth());
}


