import { useState, useRef } from 'react'
import {
  X,
  FolderOpen,
  Key,
  Terminal,
  Send,
  Trash2,
  Bluetooth,
} from 'lucide-react'
import type { Settings } from '../types'

interface SettingsModalProps {
  onClose: () => void
  onSendRaw?: (cmd: string) => Promise<string>
}

function loadSettings(): Settings {
  const raw = localStorage.getItem('app_settings')
  if (raw) return JSON.parse(raw)
  return { googleClientId: '', odometerManual: null, driveFolder: '' }
}

function saveSettings(s: Settings) {
  localStorage.setItem('app_settings', JSON.stringify(s))
}

export function SettingsModal({ onClose, onSendRaw }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [atCommand, setAtCommand] = useState('')
  const [atResponse, setAtResponse] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  const handleSave = () => {
    saveSettings(settings)
    onClose()
  }

  const handleSendAT = async () => {
    if (!atCommand.trim() || !onSendRaw) return
    setSending(true)
    try {
      const resp = await onSendRaw(atCommand.trim())
      setAtResponse((prev) => [...prev.slice(-50), `> ${atCommand}`, resp])
    } catch (err) {
      setAtResponse((prev) => [
        ...prev.slice(-50),
        `> ${atCommand}`,
        `ERRO: ${err instanceof Error ? err.message : String(err)}`,
      ])
    }
    setSending(false)
    setAtCommand('')
    setTimeout(() => {
      terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight)
    }, 50)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-bold text-white">Configurações</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          {/* Google Client ID */}
          <section>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Key className="h-4 w-4 text-blue-400" />
              Google OAuth Client ID
            </div>
            <input
              type="text"
              value={settings.googleClientId}
              onChange={(e) =>
                setSettings({ ...settings, googleClientId: e.target.value })
              }
              placeholder="xxxx.apps.googleusercontent.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-orange-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              Crie no Google Cloud Console &gt; APIs &gt; Credentials &gt; OAuth 2.0
            </p>
          </section>

          {/* Drive Folder */}
          <section>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <FolderOpen className="h-4 w-4 text-amber-400" />
              Pasta no Google Drive
            </div>
            <input
              type="text"
              value={settings.driveFolder}
              onChange={(e) =>
                setSettings({ ...settings, driveFolder: e.target.value })
              }
              placeholder="/Financeiro/01_Ingestao/Telemetria"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-orange-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              Caminho completo no Drive. Será criado automaticamente.
            </p>
          </section>

          {/* AT Terminal */}
          <section>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Terminal className="h-4 w-4 text-emerald-400" />
              Terminal AT (Depuração)
            </div>

            <div
              ref={terminalRef}
              className="mb-2 max-h-40 overflow-y-auto rounded-lg bg-black p-3 font-mono text-xs"
            >
              {atResponse.length === 0 ? (
                <span className="text-slate-600">
                  Conecte ao OBD-II e envie comandos...
                </span>
              ) : (
                atResponse.map((line, i) => (
                  <div key={i} className={line.startsWith('>') ? 'text-orange-400' : 'text-emerald-400'}>
                    {line}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={atCommand}
                onChange={(e) => setAtCommand(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAT()}
                placeholder="AT RV"
                disabled={!onSendRaw}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-600 focus:border-orange-500 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSendAT}
                disabled={sending || !onSendRaw || !atCommand.trim()}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {!onSendRaw && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                <Bluetooth className="h-3 w-3" /> Conecte ao OBD-II primeiro
              </p>
            )}

            {atResponse.length > 0 && (
              <button
                onClick={() => setAtResponse([])}
                className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
              >
                <Trash2 className="h-3 w-3" /> Limpar terminal
              </button>
            )}
          </section>

          {/* Quick Commands */}
          <section>
            <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Comandos Rápidos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['AT RV', '012F', '010D', '010C', '01A6', '03', 'AT Z', 'AT E0'].map(
                (cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setAtCommand(cmd)
                      setTimeout(() => handleSendAT(), 10)
                    }}
                    disabled={!onSendRaw}
                    className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
                  >
                    {cmd}
                  </button>
                )
              )}
            </div>
          </section>
        </div>

        <div className="border-t border-slate-800 px-5 py-4">
          <button
            onClick={handleSave}
            className="w-full rounded-xl bg-orange-500 py-2.5 font-bold text-white transition hover:bg-orange-600"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}
