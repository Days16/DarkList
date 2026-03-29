import { useState } from 'react'
import { useUiStore } from '../store/uiStore'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'
import ConfirmModal from '../components/ConfirmModal'

const ACCENT_COLORS = [
  { label: 'violet', value: '#7c6af7' },
  { label: 'blue', value: '#3b82f6' },
  { label: 'green', value: '#22c55e' },
  { label: 'amber', value: '#f59e0b' },
  { label: 'coral', value: '#ef4444' },
  { label: 'gray', value: '#6b7280' }
]

const AUTO_LOCK_VALUES: (0 | 5 | 15 | 30)[] = [0, 5, 15, 30]

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

  // Notification banner (replaces alert)
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null)
  const notify = (msg: string, ok: boolean): void => {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 3500)
  }

  // Confirm pull from cloud (replaces native confirm)
  const [showConfirmPull, setShowConfirmPull] = useState(false)

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

  const handleExport = async (): Promise<void> => {
    try {
      const res = await (window.api as any).exportData()
      if (res.success) notify(`✓ ${res.filePath}`, true)
      else notify(t('sync_error'), false)
    } catch {
      notify(t('sync_error'), false)
    }
  }

  const handleImport = async (): Promise<void> => {
    try {
      const res = await (window.api as any).importData()
      if (res.success) {
        notify(`✓ ${t('import_json')}`, true)
        const [tasks, lists] = await Promise.all([window.api.getTasks(), window.api.getLists()])
        useTaskStore.getState().setTasks(tasks)
        useListStore.getState().setLists(lists)
      } else if (res.error) {
        notify(res.error, false)
      }
    } catch {
      notify(t('sync_error'), false)
    }
  }

  const handlePush = async (): Promise<void> => {
    if (!syncUrl) return
    const res = await (window.api as any).syncPush(syncUrl, syncUser || '', syncPass || '')
    notify(res.success ? t('sync_success') : `${t('sync_error')}: ${res.error}`, res.success)
  }

  const handlePullConfirmed = async (): Promise<void> => {
    setShowConfirmPull(false)
    if (!syncUrl) return
    const res = await (window.api as any).syncPull(syncUrl, syncUser || '', syncPass || '')
    if (res.success) {
      notify(t('sync_success'), true)
      const [tasks, lists] = await Promise.all([window.api.getTasks(), window.api.getLists()])
      useTaskStore.getState().setTasks(tasks)
      useListStore.getState().setLists(lists)
    } else {
      notify(`${t('sync_error')}: ${res.error}`, false)
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

      {/* Notification banner */}
      {notification && (
        <div className={`mx-6 mt-4 px-4 py-2.5 rounded-card text-sm flex items-center gap-2
          ${notification.ok ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
          <span>{notification.ok ? '✓' : '✕'}</span>
          <span className="truncate">{notification.msg}</span>
        </div>
      )}

      <div className="flex flex-col gap-8 px-6 py-6 pb-20 max-w-md">
        {/* Language */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">{t('language')}</h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Español', value: 'es' },
              { label: 'English', value: 'en' },
              { label: 'Français', value: 'fr' },
              { label: 'Deutsch', value: 'de' },
              { label: 'Português', value: 'pt' },
              { label: 'Italiano', value: 'it' }
            ].map((l) => (
              <button
                key={l.value}
                onClick={async () => {
                  await saveSettings({ language: l.value as any })
                  ;(window.api as any).rebuildTray?.()
                }}
                className={`px-3 py-1.5 rounded-input text-sm transition-colors duration-fast
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
            {AUTO_LOCK_VALUES.map((v) => (
              <button
                key={v}
                onClick={() => saveSettings({ autoLockMinutes: v })}
                className={`px-3 py-1.5 rounded-input text-sm transition-colors duration-fast
                  ${autoLockMinutes === v
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-text-secondary hover:text-text-primary'}`}
              >
                {v === 0 ? t('never') : `${v} ${t('minutes')}`}
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
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-elevated text-text-primary rounded-input text-sm hover:bg-elevated/80 transition-colors border border-border-color"
              >
                {t('export_json')}
              </button>
              <button
                onClick={handleImport}
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
                onClick={handlePush}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-input text-sm hover:opacity-90 transition-opacity"
              >
                {t('push_to_cloud')}
              </button>
              <button
                onClick={() => syncUrl && setShowConfirmPull(true)}
                className="flex-1 px-4 py-2 bg-elevated text-text-primary rounded-input text-sm hover:bg-elevated/80 transition-colors border border-border-color"
              >
                {t('pull_from_cloud')}
              </button>
            </div>
          </div>
        </section>
      </div>

      {showConfirmPull && (
        <ConfirmModal
          message={t('sync_pull_confirm')}
          onConfirm={handlePullConfirmed}
          onCancel={() => setShowConfirmPull(false)}
          confirmLabel={language === 'es' ? 'Descargar' : 'Download'}
          danger={false}
        />
      )}
    </div>
  )
}
