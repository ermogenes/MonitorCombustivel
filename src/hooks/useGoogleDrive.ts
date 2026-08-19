import { useState, useEffect, useCallback } from 'react'
import { googleDriveService } from '../services/googleDrive'
import { syncPendingItems } from '../services/syncQueue'

export function useGoogleDrive() {
  const [signedIn, setSignedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    googleDriveService.initialize().then((ok) => {
      setSignedIn(ok)
      setLoading(false)
    })
  }, [])

  const login = useCallback(async () => {
    setLoading(true)
    try {
      const ok = await googleDriveService.login()
      setSignedIn(ok)
      if (ok) await syncPendingItems()
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    googleDriveService.logout()
    setSignedIn(false)
  }, [])

  return { signedIn, loading, login, logout }
}
