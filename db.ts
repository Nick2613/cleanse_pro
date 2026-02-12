const DB_NAME = 'DataCleanseDB';
const STORE_NAME = 'phoneHistory';
const VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("Could not open database");
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'phone' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

export const getPhoneNumberCount = async (phone: string): Promise<number> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(phone);

    request.onerror = () => reject("Error fetching phone data");
    request.onsuccess = () => {
      resolve(request.result ? request.result.count : 0);
    };
  });
};

export const incrementPhoneNumberCounts = async (phones: string[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject("Transaction failed");

    phones.forEach(phone => {
      const getRequest = store.get(phone);
      getRequest.onsuccess = () => {
        const currentData = getRequest.result;
        const newCount = currentData ? currentData.count + 1 : 1;
        store.put({ phone, count: newCount });
      };
    });
  });
};

export const getBatchCounts = async (phones: string[]): Promise<Map<string, number>> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const counts = new Map<string, number>();
    
    let processed = 0;
    if (phones.length === 0) resolve(counts);

    phones.forEach(phone => {
      const request = store.get(phone);
      request.onsuccess = () => {
        counts.set(phone, request.result ? request.result.count : 0);
        processed++;
        if (processed === phones.length) resolve(counts);
      };
      request.onerror = () => {
        console.error(`Error reading ${phone}`);
        processed++;
        if (processed === phones.length) resolve(counts);
      }
    });
  });
};

export const clearHistory = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Could not clear history");
  });
};