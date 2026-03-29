import { useState } from 'react'
import { useUiStore } from '../store/uiStore'

const ACCENT_COLORS = [
  { label: 'violet', value: '#7c6af7' },
  { label: 'blue', value: '#3b82f6' },
  { label: 'green', value: '#22c55e' },
  { label: 'amber', value: '#f59e0b' },
  { label: 'coral', value: '#ef4444' },
  { label: 'gray', value: '#6b7280' }
]

const AUTO_LOCK_OPTIONS: { label: string; value: 0 | 5 | 15 | 30 }[] = [
  { label: 'Nunca', value: 0 },
  { label: '5 minutos', value: 5 },
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 }
]

interface Props {
  onBack: () => void
}

export default function Settings({ onBack }: Props): JSX.Element {
  const { 
    accentColor, autoLockMinutes, theme, language, backupFrequencyDays, 
    syncUrl, syncUser, syncPass,
    saveSettings, t 
  } = useUiStore()

  // PIN change
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMsg, setPinMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const changePin = async (): Promise<void> => {
    setPinMsg(null)
    if (newPin.length < 4) { setPinMsg({ type: 'err', text: t('pin_min_length') }); return }
    if (newPin !== confirmPin) { setPinMsg({ type: 'err', text: t('pin_mismatch') }); return }
    const res = await window.api.changePin(oldPin, newPin)
    if (res.success) {
      setPinMsg({ type: 'ok', text: t('pin_updated') })
      setOldPin(''); setNewPin(''); setConfirmPin('')
    } else {
      setPinMsg({ type: 'err', text: res.error ?? t('pin_error') })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-base overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border-color">
        <button
          onClick={onBack}
          className="text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← {t('back')}
        </button>
        <h1 className="text-text-primary font-semibold">{t('settings')}</h1>
      </div>

      <div className="flex flex-col gap-8 px-6 py-6 pb-20 max-w-md">
        {/* Language */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">{t('language')}</h2>
          <div className="flex gap-2">
            {[
              { label: 'Español', value: 'es' },
              { label: 'English', value: 'en' }
            ].map((l) => (
              <button
                key={l.value}
                onClick={() => saveSettings({ language: l.value as any })}
                className={`flex-1 px-3 py-1.5 rounded-input text-sm transition-colors duration-fast
                  ${language === l.value
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-text-secondary hover:text-text-primary'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">{t('theme')}</h2>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((v) => (
              <button
                key={v}
                onClick={() => saveSettings({ theme: v })}
                className={`flex-1 px-3 py-1.5 rounded-input text-sm transition-colors duration-fast capitalize
                  ${theme === v
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-text-secondary hover:text-text-primary'}`}
              >
                {t(`theme_${v}` as any)}
              </button>
            ))}
          </div>
        </section>

        {/* Accent color */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">{t('accent_color_label')}</h2>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => saveSettings({ accentColor: c.value })}
                title={c.label}
                className={`w-8 h-8 rounded-full transition-all duration-fast
                  ${accentColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-base scale-110' : ''}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </section>

        {/* Auto-lock */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">{t('auto_lock')}</h2>
          <div className="flex gap-2 flex-wrap">
            {AUTO_LOCK_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => saveSettings({ autoLockMinutes: o.value })}
                className={`px-3 py-1.5 rounded-input text-sm transition-colors duration-fast
                  ${autoLockMinutes === o.value
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-text-secondary hover:text-text-primary'}`}
              >
                {o.value === 0 ? t('never') : `${o.value} ${t('minutes')}`}
              </button>
            ))}
          </div>
        </section>

        {/* Change PIN */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">{t('change_pin')}</h2>
          <div className="flex flex-col gap-2">
            <input
              type="password"
              inputMode="numeric"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('current_pin')}
              className="bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none
                border border-transparent focus:border-accent transition-colors"
            />
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('new_pin')}
              className="bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none
                border border-transparent focus:border-accent transition-colors"
            />
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('confirm_pin')}
              onKeyDown={(e) => e.key === 'Enter' && changePin()}
              className="bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none
                border border-transparent focus:border-accent transition-colors"
            />
            {pinMsg && (
              <p className={`text-xs ${pinMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {pinMsg.text}
              </p>
            )}
            <button
              onClick={changePin}
              disabled={!oldPin || !newPin || !confirmPin}
              className="mt-1 px-4 py-2 bg-accent text-white rounded-input text-sm
                disabled:opacity-40 hover:opacity-90 transition-opacity self-start"
            >
              {t('update_pin')}
            </button>
          </div>
        </section>

        {/* Data Backup */}
        <section className="pt-8 border-t border-border-color">
          <h2 className="text-text-primary text-sm font-medium mb-3">{t('backup')}</h2>
          <div className="flex flex-col gap-4">
            <p className="text-text-secondary text-xs">
              {t('backup_desc')}
            </p>
            
            <div className="bg-elevated/50 p-3 rounded-card border border-border-subtle">
              <h3 className="text-text-primary text-[10px] font-bold uppercase tracking-widest mb-2">{t('auto_backup')}</h3>
              <div className="flex gap-1.5">
                {[
                  { label: t('off'), value: 0 },
                  { label: '7d', value: 7 },
                  { label: '30d', value: 30 }
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => saveSettings({ backupFrequencyDays: f.value })}
                    className={`flex-1 py-1 rounded text-[10px] border transition-all ${
                      backupFrequencyDays === f.value 
                        ? 'bg-accent border-accent text-white font-bold' 
                        : 'border-border-color text-text-secondary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const res = await (window.api as any).exportData()
                    if (res.success) alert(`Ok: ${res.filePath}`)
                  } catch (e) {
                    alert('Error')
                  }
                }}
                className="flex-1 px-4 py-2 bg-elevated text-text-primary rounded-input text-sm hover:bg-elevated/80 transition-colors border border-border-color"
              >
                {t('export_json')}
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await (window.api.importData())
                    if (res.success) {
                      alert('Success')
                      window.location.reload()
                    }
                  } catch (e) {
                    alert('Error')
                  }
                }}
                className="flex-1 px-4 py-2 bg-elevated text-text-primary rounded-input text-sm hover:bg-elevated/80 transition-colors border border-border-color"
              >
                {t('import_json')}
              </button>
            </div>
          </div>
        </section>

        {/* Cloud Sync */}
        <section className="pt-8 border-t border-border-color">
          <h2 className="text-text-primary text-sm font-medium mb-3">{t('cloud_sync')}</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={syncUrl || ''}
              onChange={(e) => saveSettings({ syncUrl: e.target.value })}
              placeholder={t('cloud_url')}
              className="bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none border border-transparent focus:border-accent"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={syncUser || ''}
                onChange={(e) => saveSettings({ syncUser: e.target.value })}
                placeholder={t('cloud_user')}
                className="flex-1 bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none border border-transparent focus:border-accent"
              />
              <input
                type="password"
                value={syncPass || ''}
                onChange={(e) => saveSettings({ syncPass: e.target.value })}
                placeholder={t('cloud_pass')}
                className="flex-1 bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none border border-transparent focus:border-accent"
              />
            </div>
            
            <div className="flex gap-2 mt-1">
              <button
                onClick={async () => {
                  if (!syncUrl) return
                  const res = await (window.api as any).syncPush(syncUrl, syncUser || '', syncPass || '')
                  alert(res.success ? t('sync_success') : `${t('sync_error')}: ${res.error}`)
                }}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-input text-sm hover:opacity-90 transition-opacity"
              >
                {t('push_to_cloud')}
              </button>
              <button
                onClick={async () => {
                  if (!syncUrl) return
                  if (!confirm(t('backup_desc'))) return
                  const res = await (window.api as any).syncPull(syncUrl, syncUser || '', syncPass || '')
                  if (res.success) {
                    alert(t('sync_success'))
                    window.location.reload()
                  } else {
                    alert(`${t('sync_error')}: ${res.error}`)
                  }
                }}
                className="flex-1 px-4 py-2 bg-elevated text-text-primary rounded-input text-sm hover:bg-elevated/80 transition-colors border border-border-color"
              >
                {t('pull_from_cloud')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
