import { useRegisterSW } from 'virtual:pwa-register/react'

// Since this app is meant to work forever without a computer or network,
// updates are opt-in: the new version downloads in the background and
// waits for an explicit tap before replacing the running app, so a workout
// mid-session is never interrupted.
export function UpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
  })

  if (!needRefresh) return null

  return (
    <div
      className="fixed inset-x-4 z-30 flex items-center justify-between gap-3 rounded-2xl bg-slate-800 px-4 py-3 shadow-lg"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
    >
      <span className="text-sm text-slate-200">Update available</span>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        Reload
      </button>
    </div>
  )
}
