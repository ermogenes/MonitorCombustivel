import type { RefuelEvent } from '../types'

const DRIVE_API_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const DRIVE_API_FILES = 'https://www.googleapis.com/drive/v3/files'
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

const DEFAULT_FOLDER_PATH = '/Financeiro/01_Ingestao/Telemetria'

let accessToken: string | null = null
let tokenClient: any = null
let folderIdCache: Record<string, string> = {}

function getSettings(): { clientId: string; driveFolder: string } {
  const raw = localStorage.getItem('app_settings')
  if (raw) {
    const parsed = JSON.parse(raw)
    return {
      clientId: parsed.googleClientId || '',
      driveFolder: parsed.driveFolder || DEFAULT_FOLDER_PATH,
    }
  }
  return { clientId: '', driveFolder: DEFAULT_FOLDER_PATH }
}

function loadGIS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'))
    document.head.appendChild(script)
  })
}

async function getFolderId(path: string): Promise<string> {
  if (folderIdCache[path]) return folderIdCache[path]

  const parts = path.split('/').filter(Boolean)
  let parentId = 'root'

  for (const part of parts) {
    const q = `name='${part}' and parents='${parentId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const res = await fetch(
      `${DRIVE_API_FILES}?q=${encodeURIComponent(q)}&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()

    if (data.files && data.files.length > 0) {
      parentId = data.files[0].id
    } else {
      const createRes = await fetch(DRIVE_API_FILES, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: part,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        }),
      })
      const created = await createRes.json()
      parentId = created.id
    }
  }

  folderIdCache[path] = parentId
  return parentId
}

function formatFileName(event: RefuelEvent): string {
  const d = new Date(event.timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `refuel_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`
}

export const googleDriveService = {
  isSignedIn(): boolean {
    return !!accessToken
  },

  getAccessToken(): string | null {
    return accessToken
  },

  async initialize(): Promise<boolean> {
    const { clientId } = getSettings()
    if (!clientId) return false

    try {
      await loadGIS()
      return new Promise((resolve) => {
        tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error) {
              resolve(false)
              return
            }
            accessToken = response.access_token
            resolve(true)
          },
        })

        const stored = localStorage.getItem('gdrive_token')
        if (stored) {
          const { token, expiresAt } = JSON.parse(stored)
          if (Date.now() < expiresAt) {
            accessToken = token
            resolve(true)
            return
          }
        }
        resolve(false)
      })
    } catch {
      return false
    }
  },

  async login(): Promise<boolean> {
    const { clientId } = getSettings()
    if (!clientId) throw new Error('Configure o Google Client ID nas configurações')

    await loadGIS()

    return new Promise((resolve, reject) => {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error))
            return
          }
          accessToken = response.access_token
          localStorage.setItem(
            'gdrive_token',
            JSON.stringify({
              token: accessToken,
              expiresAt: Date.now() + (response.expires_in || 3600) * 1000,
            })
          )
          resolve(true)
        },
      })
      tokenClient.requestAccessToken({ prompt: 'consent' })
    })
  },

  logout(): void {
    if (accessToken) {
      ;(window as any).google.accounts.oauth2.revoke(accessToken, () => {})
    }
    accessToken = null
    localStorage.removeItem('gdrive_token')
    folderIdCache = {}
  },

  async uploadEvent(event: RefuelEvent): Promise<string> {
    if (!accessToken) throw new Error('Não autenticado no Google Drive')

    const { driveFolder } = getSettings()
    const folderId = await getFolderId(driveFolder)
    const fileName = formatFileName(event)
    const jsonContent = JSON.stringify(event, null, 2)

    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/json',
    }

    const form = new FormData()
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    )
    form.append('file', new Blob([jsonContent], { type: 'application/json' }))

    const res = await fetch(`${DRIVE_API_UPLOAD}?uploadType=multipart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `Upload falhou: ${res.status}`)
    }

    const result = await res.json()
    return result.id as string
  },

  getDefaultFolderPath(): string {
    return DEFAULT_FOLDER_PATH
  },
}
