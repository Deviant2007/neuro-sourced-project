import { db } from './lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

// Firestore key-value store — drop-in replacement for the old localStorage adapter.
// All data lives in the "kv_store" collection, one document per key.
const COLLECTION = 'kv_store';

const storage = {
  async get(key) {
    try {
      const snap = await getDoc(doc(db, COLLECTION, key));
      return snap.exists() ? { value: snap.data().value } : null;
    } catch (e) {
      return null;
    }
  },

  async set(key, value) {
    try {
      await setDoc(doc(db, COLLECTION, key), { value, updatedAt: new Date().toISOString() });
      return true;
    } catch (e) {
      return null;
    }
  },

  async delete(key) {
    try {
      await deleteDoc(doc(db, COLLECTION, key));
      return true;
    } catch (e) {
      return null;
    }
  },

  async list(prefix) {
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      const keys = [];
      snap.forEach(d => {
        if (!prefix || d.id.startsWith(prefix)) keys.push(d.id);
      });
      return { keys };
    } catch (e) {
      return { keys: [] };
    }
  },
};

export default storage;
