// ============================================================
//  firebaseService.js
//  Firebase setup + Shorts URL
//  Includes:
//    - Cursor-based pagination (startAfter)
//    - Fisher-Yates shuffle per page
//    - add / delete / real-time methods
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
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  getCountFromServer,
} from 'firebase/firestore';

// ─────────────────────────────────────────────
//  STEP 1 — Your Firebase config
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
//  STEP 2 — Init Firebase singleton
// ─────────────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

// ─────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────
const SHORTS_COLLECTION = 'shortsUrls';
const PAGE_SIZE         = 10;             // URLs loaded per page
const shortsRef         = () => collection(db, SHORTS_COLLECTION);

// ─────────────────────────────────────────────
//  Fisher-Yates Shuffle
//  Returns a NEW shuffled array, never mutates original
// ─────────────────────────────────────────────
export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ─────────────────────────────────────────────
//  ADD a Shorts URL
//
//  await addShortsUrl('https://youtube.com/shorts/abc');
//  Returns: { id, url, createdAt }
// ─────────────────────────────────────────────
export const addShortsUrl = async (url) => {
  try {
    if (!url || typeof url !== 'string') throw new Error('Invalid URL');
    const docRef = await addDoc(shortsRef(), {
      url:       url.trim(),
      createdAt: serverTimestamp(),
    });
    console.log('[Firebase] Added:', docRef.id);
    return { id: docRef.id, url, createdAt: new Date() };
  } catch (error) {
    console.error('[Firebase] addShortsUrl error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  PAGINATED FETCH — page 1 (no cursor)
//
//  const { urls, lastDoc, hasMore } = await fetchShortsPage();
//
//  Returns:
//    urls    : string[]          — shuffled batch
//    lastDoc : DocumentSnapshot  — cursor for next page
//    hasMore : boolean           — false when all loaded
// ─────────────────────────────────────────────
export const fetchShortsPage = async (lastDocument = null) => {
  try {
    let q = query(
      shortsRef(),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    );

    // If cursor provided, start after last fetched doc
    if (lastDocument) {
      q = query(
        shortsRef(),
        orderBy('createdAt', 'desc'),
        startAfter(lastDocument),
        limit(PAGE_SIZE),
      );
    }

    const snapshot = await getDocs(q);
    const docs     = snapshot.docs;
    const urls     = shuffleArray(docs.map((d) => d.data().url));  // shuffle each batch

    console.log(
      `[Firebase] Page fetched: ${urls.length} URLs`,
      lastDocument ? '(next page)' : '(first page)',
    );

    return {
      urls,
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,  // cursor for next call
      hasMore: docs.length === PAGE_SIZE,                         // false = end of list
    };
  } catch (error) {
    console.error('[Firebase] fetchShortsPage error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
//  TOTAL COUNT (optional — for progress display)
//
//  const total = await getShortsCount();
// ─────────────────────────────────────────────
export const getShortsCount = async () => {
  try {
    const snap = await getCountFromServer(shortsRef());
    return snap.data().count;
  } catch (error) {
    console.error('[Firebase] getShortsCount error:', error);
    return 0;
  }
};

// ─────────────────────────────────────────────
//  REAL-TIME listener — first page only (ordered)
//  For live-update of the top feed while user watches
//
//  const unsub = subscribeShortsUrls((urls) => setHistory(urls));
//  return () => unsub();
// ─────────────────────────────────────────────
export const subscribeShortsUrls = (callback, pageSize = PAGE_SIZE) => {
  const q = query(
    shortsRef(),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const urls = snapshot.docs.map((d) => d.data().url);
      console.log('[Firebase] Real-time update:', urls.length, 'URLs');
      callback(urls);
    },
    (error) => console.error('[Firebase] subscribeShortsUrls error:', error),
  );
  return unsubscribe;
};

// ─────────────────────────────────────────────
//  REAL-TIME listener — RANDOMIZED (first page)
//
//  const unsub = subscribeShortsUrlsRandom((urls) => setHistory(urls));
//  return () => unsub();
// ─────────────────────────────────────────────
export const subscribeShortsUrlsRandom = (callback, pageSize = PAGE_SIZE) => {
  const q = query(
    shortsRef(),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const urls     = snapshot.docs.map((d) => d.data().url);
      const shuffled = shuffleArray(urls);
      console.log('[Firebase] Real-time shuffled:', shuffled.length, 'URLs');
      callback(shuffled);
    },
    (error) => console.error('[Firebase] subscribeShortsUrlsRandom error:', error),
  );
  return unsubscribe;
};

// ─────────────────────────────────────────────
//  FETCH with doc IDs (useful for delete)
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
//  DELETE a Shorts URL by document ID
//  await deleteShortsUrl('docId123');
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
export const deleteCollection = async () => {
  const snapshot = await getDocs(collection(db, "shortsUrls"));

  const promises = snapshot.docs.map(d => deleteDoc(d.ref));

  await Promise.all(promises);

  console.log("Collection deleted");
};

export const deleteAllShorts = async () => {
  try {
    const snapshot = await getDocs(shortsRef());
    console.log("shortsRef",shortsRef);
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
export { db, app, PAGE_SIZE };