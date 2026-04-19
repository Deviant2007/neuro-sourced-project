// Storage helper — mirrors window.storage API using localStorage
const storage = {
  async get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return null;
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return null;
    }
  },
  async list(prefix) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!prefix || key.startsWith(prefix)) keys.push(key);
      }
      return { keys };
    } catch (e) {
      return { keys: [] };
    }
  }
};

export default storage;
