// ============================================================
//  firebaseService.js
//  Firebase setup + Shorts URL — add / fetch / delete methods
//  Includes Fisher-Yates shuffle for randomized playback
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
//  STEP 1 — Paste your Firebase project config
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
//  STEP 2 — Initialize Firebase (safe singleton)
// ─────────────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ─────────────────────────────────────────────
//  Collection reference
// ─────────────────────────────────────────────
const SHORTS_COLLECTION = 'shortsUrls';
const shortsRef = () => collection(db, SHORTS_COLLECTION);

// ─────────────────────────────────────────────
//  Fisher-Yates Shuffle
//  Returns a NEW shuffled array, never mutates original
//
//  shuffleArray(['a','b','c','d']) => ['c','a','d','b']
// ─────────────────────────────────────────────
export const shuffleArray = array => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ─────────────────────────────────────────────
//  ADD a Shorts URL
//  await addShortsUrl('https://youtube.com/shorts/abc123');
//  Returns: { id, url, createdAt }
// ─────────────────────────────────────────────
export const addShortsUrl = async url => {
  try {
    if (!url || typeof url !== 'string') throw new Error('Invalid URL');
    const docRef = await addDoc(shortsRef(), {
      url: url.trim(),
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
//  FETCH all Shorts URLs — ordered (latest first)
//  Returns: string[]
// ─────────────────────────────────────────────
export const fetchShortsUrls = async () => {
  try {
    const q = query(shortsRef(), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const urls = snapshot.docs.map(d => d.data().url);
    console.log('[Firebase] Fetched Shorts URLs:', urls.length);
    return urls;
  } catch (error) {
    console.error('[Firebase] fetchShortsUrls error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  FETCH Shorts URLs — RANDOMIZED every call
//
//  Fetches all docs then Fisher-Yates shuffles them.
//  Every call returns a DIFFERENT order — great for
//  Shorts style feed where order should feel fresh.
//
//  const urls = await fetchShortsUrlsRandom();
//  Returns: string[] (shuffled)
// ─────────────────────────────────────────────
export const fetchShortsUrlsRandom = async () => {
  try {
    const snapshot = await getDocs(shortsRef());
    const urls = snapshot.docs.map(d => d.data().url);
    const shuffled = shuffleArray(urls);
    console.log('[Firebase] Fetched & shuffled:', shuffled.length, 'URLs');
    return shuffled;
  } catch (error) {
    console.error('[Firebase] fetchShortsUrlsRandom error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  FETCH with doc IDs (useful for delete operations)
//  Returns: Array<{ id, url, createdAt }>
// ─────────────────────────────────────────────
export const fetchShortsWithIds = async () => {
  try {
    const q = query(shortsRef(), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      url: d.data().url,
      createdAt: d.data().createdAt?.toDate?.() ?? null,
    }));
  } catch (error) {
    console.error('[Firebase] fetchShortsWithIds error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  REAL-TIME listener — ordered (latest first)
//
//  const unsub = subscribeShortsUrls((urls) => setHistory(urls));
//  return () => unsub();  // cleanup
//
//  Returns: unsubscribe function
// ─────────────────────────────────────────────
export const subscribeShortsUrls = callback => {
  const q = query(shortsRef(), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(
    q,
    snapshot => {
      const urls = snapshot.docs.map(d => d.data().url);
      console.log('[Firebase] Real-time update:', urls.length, 'URLs');
      callback(urls);
    },
    error => {
      console.error('[Firebase] subscribeShortsUrls error:', error);
    },
  );
  return unsubscribe;
};

// ─────────────────────────────────────────────
//  REAL-TIME listener — RANDOMIZED on every update
//
//  Every Firestore change (add/delete) triggers a
//  fresh Fisher-Yates shuffle — feed order stays random.
//
//  const unsub = subscribeShortsUrlsRandom((urls) => setHistory(urls));
//  return () => unsub();
//
//  Returns: unsubscribe function
// ─────────────────────────────────────────────
export const subscribeShortsUrlsRandom = callback => {
  const unsubscribe = onSnapshot(
    shortsRef(),
    snapshot => {
      const urls = snapshot.docs.map(d => d.data().url);
      const shuffled = shuffleArray(urls);
      console.log(
        '[Firebase] Real-time shuffled update:',
        shuffled.length,
        'URLs',
      );
      callback(shuffled);
    },
    error => {
      console.error('[Firebase] subscribeShortsUrlsRandom error:', error);
    },
  );
  return unsubscribe;
};

// ─────────────────────────────────────────────
//  DELETE a Shorts URL by document ID
//  await deleteShortsUrl('docId123');
// ─────────────────────────────────────────────
export const deleteShortsUrl = async docId => {
  try {
    await deleteDoc(doc(db, SHORTS_COLLECTION, docId));
    console.log('[Firebase] Deleted doc:', docId);
  } catch (error) {
    console.error('[Firebase] deleteShortsUrl error:', error);
    throw error;
  }
};

export const deleteAllShorts = async () => {
  try {
    const snapshot = await getDocs(shortsRef());
    console.log("snapshot",snapshot);
    
    const deletePromises = snapshot.docs.map(d =>
      deleteDoc(doc(db, SHORTS_COLLECTION, d.id))
    );

    await Promise.all(deletePromises);

    console.log("All shorts deleted successfully");
  } catch (error) {
    console.error("Error deleting all shorts:", error);
  }
};
export { db, app };
