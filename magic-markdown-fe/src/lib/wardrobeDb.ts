export const MAX_PEOPLE = 40;
export const MAX_GARMENTS = 80;

const DB_NAME = "taylor-wardrobe";
const DB_VERSION = 1;

export type WardrobePerson = {
  id: string;
  dataUrl: string;
  fingerprint: string;
  createdAt: number;
  label?: string;
};

export type WardrobeGarment = {
  id: string;
  imageBase64: string;
  fingerprint: string;
  source: "generated" | "uploaded";
  createdAt: number;
  label?: string;
  prompt?: string;
};

export class WardrobeQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WardrobeQuotaError";
  }
}

export function fingerprint(value: string): string {
  let h = 5381;
  for (let i = 0; i < value.length; i++) h = ((h << 5) + h) ^ value.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("people")) {
        const people = db.createObjectStore("people", { keyPath: "id" });
        people.createIndex("fingerprint", "fingerprint", { unique: false });
      }
      if (!db.objectStoreNames.contains("garments")) {
        const garments = db.createObjectStore("garments", { keyPath: "id" });
        garments.createIndex("fingerprint", "fingerprint", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Không mở được tủ đồ."));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Lỗi tủ đồ."));
  });
}

async function withStore<T>(
  store: "people" | "garments",
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction(store, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Lỗi tủ đồ."));
      tx.onabort = () => reject(tx.error ?? new Error("Lỗi tủ đồ."));
    });
    const value = await reqToPromise(fn(tx.objectStore(store)));
    await done;
    return value;
  } finally {
    db.close();
  }
}

export async function listPeople(): Promise<WardrobePerson[]> {
  const rows = await withStore("people", "readonly", (s) => s.getAll());
  return (rows as WardrobePerson[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listGarments(): Promise<WardrobeGarment[]> {
  const rows = await withStore("garments", "readonly", (s) => s.getAll());
  return (rows as WardrobeGarment[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function savePerson(dataUrl: string, label?: string): Promise<WardrobePerson> {
  const fp = fingerprint(dataUrl);
  const existing = await listPeople();
  const dup = existing.find((p) => p.fingerprint === fp);
  if (dup) return dup;
  if (existing.length >= MAX_PEOPLE) {
    throw new WardrobeQuotaError(`Tủ đồ đã đủ ${MAX_PEOPLE} ảnh người. Xóa bớt rồi lưu lại.`);
  }
  const row: WardrobePerson = {
    id: crypto.randomUUID(),
    dataUrl,
    fingerprint: fp,
    createdAt: Date.now(),
    label,
  };
  await withStore("people", "readwrite", (s) => s.put(row));
  return row;
}

export async function saveGarment(input: {
  imageBase64: string;
  source: "generated" | "uploaded";
  prompt?: string;
  label?: string;
}): Promise<WardrobeGarment> {
  const fp = fingerprint(input.imageBase64);
  const existing = await listGarments();
  const dup = existing.find((g) => g.fingerprint === fp);
  if (dup) return dup;
  if (existing.length >= MAX_GARMENTS) {
    throw new WardrobeQuotaError(`Tủ đồ đã đủ ${MAX_GARMENTS} quần áo. Xóa bớt rồi lưu lại.`);
  }
  const row: WardrobeGarment = {
    id: crypto.randomUUID(),
    imageBase64: input.imageBase64,
    fingerprint: fp,
    source: input.source,
    createdAt: Date.now(),
    prompt: input.prompt,
    label: input.label,
  };
  await withStore("garments", "readwrite", (s) => s.put(row));
  return row;
}

export async function removePerson(id: string): Promise<void> {
  await withStore("people", "readwrite", (s) => s.delete(id));
}

export async function removeGarment(id: string): Promise<void> {
  await withStore("garments", "readwrite", (s) => s.delete(id));
}
