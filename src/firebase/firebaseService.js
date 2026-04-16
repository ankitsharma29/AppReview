// ============================================================
//  firebaseService.js
//  Firebase setup + Shorts URL — add / fetch / delete methods
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

// ─────────────────────────────────────────────
//  🔥 STEP 1 — Paste your Firebase project config
//  (Firebase Console → Project Settings → Your apps)
// ─────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyCdRkrhSNlh_O7WwR8DMB7ZzGFjDcxJLwo",
  authDomain: "flutterfire-6e119.firebaseapp.com",
  databaseURL: "https://flutterfire-6e119-default-rtdb.firebaseio.com",
  projectId: "flutterfire-6e119",
  storageBucket: "flutterfire-6e119.appspot.com",
  messagingSenderId: "137816430576",
  appId: "1:137816430576:android:593dd581606672cc3caf35"
};

// ─────────────────────────────────────────────
//  🔥 STEP 2 — Initialize Firebase (safe singleton)
// ─────────────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

// ─────────────────────────────────────────────
//  📦 Collection reference
// ─────────────────────────────────────────────
const SHORTS_COLLECTION = 'shortsUrls';   // Firestore collection name
const shortsRef = () => collection(db, SHORTS_COLLECTION);

// ─────────────────────────────────────────────
//  ✅ ADD a Shorts URL
//
//  Usage:
//    await addShortsUrl('https://youtube.com/shorts/abc123');
//
//  Returns: { id: 'docId', url, createdAt }
// ─────────────────────────────────────────────
export const addShortsUrl = async (url) => {
  try {
    if (!url || typeof url !== 'string') throw new Error('Invalid URL');

    const docRef = await addDoc(shortsRef(), {
      url:       url.trim(),
      createdAt: serverTimestamp(),
    });

    console.log('[Firebase] Shorts URL added:', docRef.id);
    return { id: docRef.id, url, createdAt: new Date() };
  } catch (error) {
    console.error('[Firebase] addShortsUrl error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  ✅ FETCH all Shorts URLs (one-time)
//
//  Usage:
//    const urls = await fetchShortsUrls();
//    // urls → ['https://...', 'https://...']
//
//  Returns: string[]
// ─────────────────────────────────────────────
export const fetchShortsUrls = async () => {
  try {
    const q        = query(shortsRef(), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const urls = snapshot.docs.map((d) => d.data().url);
    console.log('[Firebase] Fetched Shorts URLs:', urls.length);
    return urls;
  } catch (error) {
    console.error('[Firebase] fetchShortsUrls error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  ✅ FETCH with doc IDs (useful for delete)
//
//  Returns: Array<{ id, url, createdAt }>
// ─────────────────────────────────────────────
export const fetchShortsWithIds = async () => {
  try {
    const q        = query(shortsRef(), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id:        d.id,
      url:       d.data().url,
      createdAt: d.data().createdAt?.toDate?.() ?? null,
    }));
  } catch (error) {
    console.error('[Firebase] fetchShortsWithIds error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  ✅ REAL-TIME listener for Shorts URLs
//
//  Usage:
//    const unsub = subscribeShortsUrls((urls) => setHistory(urls));
//    // call unsub() to stop listening (e.g., in useEffect cleanup)
//
//  Returns: unsubscribe function
// ─────────────────────────────────────────────
export const subscribeShortsUrls = (callback) => {
  const q = query(shortsRef(), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const urls = snapshot.docs.map((d) => d.data().url);
      console.log('[Firebase] Real-time update:', urls.length, 'URLs');
      callback(urls);
    },
    (error) => {
      console.error('[Firebase] subscribeShortsUrls error:', error);
    },
  );

  return unsubscribe;
};

// ─────────────────────────────────────────────
//  ✅ DELETE a Shorts URL by document ID
//
//  Usage:
//    await deleteShortsUrl('docId123');
// ─────────────────────────────────────────────
export const deleteShortsUrl = async (docId) => {
  try {
    await deleteDoc(doc(db, SHORTS_COLLECTION, docId));
    console.log('[Firebase] Deleted doc:', docId);
  } catch (error) {
    console.error('[Firebase] deleteShortsUrl error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  Export db for direct use if needed
// ─────────────────────────────────────────────
export { db, app };