import { db } from './lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const COLLECTION = 'kv_store';

// localStorage fallback used when Firebase is not configured
const local = {
  async get(key) {
    try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return null; }
  },
  async delete(key) {
    try { localStorage.removeItem(key); return true; } catch { return null; }
  },
  async list(prefix) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!prefix || k.startsWith(prefix)) keys.push(k);
      }
      return { keys };
    } catch { return { keys: [] }; }
  },
};

const storage = {
  async get(key) {
    if (!db) return local.get(key);
    try {
      const snap = await getDoc(doc(db, COLLECTION, key));
      return snap.exists() ? { value: snap.data().value } : null;
    } catch { return local.get(key); }
  },

  async set(key, value) {
    if (!db) return local.set(key, value);
    try {
      await setDoc(doc(db, COLLECTION, key), { value, updatedAt: new Date().toISOString() });
      return true;
    } catch { return local.set(key, value); }
  },

  async delete(key) {
    if (!db) return local.delete(key);
    try {
      await deleteDoc(doc(db, COLLECTION, key));
      return true;
    } catch { return local.delete(key); }
  },

  async list(prefix) {
    if (!db) return local.list(prefix);
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      const keys = [];
      snap.forEach(d => { if (!prefix || d.id.startsWith(prefix)) keys.push(d.id); });
      return { keys };
    } catch { return local.list(prefix); }
  },
};

export default storage;
