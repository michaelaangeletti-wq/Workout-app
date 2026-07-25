import { Link } from 'react-router-dom'

const STEPS = [
  {
    title: 'Open this app in Safari',
    body: "This has to be Safari, not Chrome — it's the only browser on iPhone that can add a web app to your home screen.",
  },
  {
    title: 'Tap the Share icon',
    body: 'The square with an arrow pointing up, in the bottom toolbar (or top of the address bar on newer iOS).',
  },
  {
    title: "Scroll down and tap 'Add to Home Screen'",
    body: "It's further down the share sheet, below the row of app icons.",
  },
  {
    title: "Tap 'Add' in the top right",
    body: 'An app icon appears on your home screen, just like any other app.',
  },
  {
    title: "From now on, open it from the home screen icon",
    body: "Not from a Safari bookmark. Opening it as an installed app is what makes it work fully offline — no computer, no WiFi, no signal needed after this.",
  },
]

export function InstallHelp() {
  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-10">
      <Link to="/settings" className="text-sm text-slate-400">
        ← Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-50">Install on your iPhone</h1>
      <p className="mt-1 text-sm text-slate-400">
        Do this once. After that, this app lives on your phone permanently — it doesn't need your computer,
        WiFi, or this page to work ever again.
      </p>

      <ol className="mt-6 flex flex-col gap-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              {i + 1}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">{step.title}</div>
              <div className="mt-0.5 text-xs text-slate-400">{step.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
        Tip: after installing, turn on Airplane Mode and reopen the app from your home screen — if it still
        opens and everything works, you're fully offline-independent.
      </div>
    </div>
  )
}
