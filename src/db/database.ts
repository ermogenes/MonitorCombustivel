import { openDB, type IDBPDatabase } from 'idb'
import type { SyncQueueItem, RefuelEvent, SyncStatus } from '../types'

const DB_NAME = 'monitor-combustivel'
const DB_VERSION = 1
const STORE_NAME = 'sync_queue'

let dbInstance: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('status', 'status')
        store.createIndex('createdAt', 'createdAt')
      }
    },
  })
  return dbInstance
}

function generateId(): string {
  return `refuel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function addRefuelEvent(event: Omit<RefuelEvent, 'id'>): Promise<SyncQueueItem> {
  const db = await getDB()
  const id = generateId()
  const fullEvent: RefuelEvent = { ...event, id }
  const item: SyncQueueItem = {
    id,
    event: fullEvent,
    status: 'pending',
    createdAt: new Date().toISOString(),
    lastAttempt: null,
    error: null,
  }
  await db.put(STORE_NAME, item)
  return item
}

export async function getAllItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  return all.filter((i) => i.status === 'pending')
}

export async function updateItemStatus(
  id: string,
  status: SyncStatus,
  error?: string
): Promise<void> {
  const db = await getDB()
  const item = await db.get(STORE_NAME, id)
  if (!item) return
  item.status = status
  item.lastAttempt = new Date().toISOString()
  item.error = error ?? null
  await db.put(STORE_NAME, item)
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function getRecentEvents(limit = 20): Promise<SyncQueueItem[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  return all
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export async function getPendingCount(): Promise<number> {
  const items = await getPendingItems()
  return items.length
}
