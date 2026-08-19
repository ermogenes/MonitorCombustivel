import { getPendingItems, updateItemStatus } from '../db/database'
import { googleDriveService } from './googleDrive'

let syncing = false

export async function syncPendingItems(): Promise<number> {
  if (syncing) return 0
  if (!navigator.onLine || !googleDriveService.isSignedIn()) return 0

  syncing = true
  let syncedCount = 0

  try {
    const pending = await getPendingItems()
    for (const item of pending) {
      try {
        await googleDriveService.uploadEvent(item.event)
        await updateItemStatus(item.id, 'synced')
        syncedCount++
      } catch (err) {
        await updateItemStatus(
          item.id,
          'error',
          err instanceof Error ? err.message : String(err)
        )
      }
    }
  } finally {
    syncing = false
  }

  return syncedCount
}

export function setupAutoSync(): void {
  window.addEventListener('online', () => {
    setTimeout(() => syncPendingItems(), 2000)
  })
}
