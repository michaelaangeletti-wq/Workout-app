import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Onboarding } from './screens/Onboarding'
import { Today } from './screens/Today'
import { LogSet } from './screens/LogSet'
import { History } from './screens/History'
import { Settings } from './screens/Settings'
import { Routines } from './screens/Routines'
import { SuggestedRoutines } from './screens/SuggestedRoutines'
import { InstallHelp } from './screens/InstallHelp'
import { BottomNav } from './components/BottomNav'
import { UpdatePrompt } from './UpdatePrompt'
import { useSettings } from './db/useSettings'

// HashRouter (not BrowserRouter) because this is deployed as a static site
// on GitHub Pages with no server-side rewrite rules — hash routes always
// resolve correctly with zero server config, on GitHub Pages and offline
// alike, once the app shell is cached by the service worker.
export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}

function AppShell() {
  const settings = useSettings()
  const location = useLocation()

  if (settings === undefined) return null

  if (!settings.onboardingComplete) {
    return <Onboarding onComplete={() => {}} />
  }

  const showNav = !['/log', '/install-help', '/routines', '/routines/suggested'].includes(location.pathname)

  return (
    <>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/log" element={<LogSet />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/routines/suggested" element={<SuggestedRoutines />} />
        <Route path="/install-help" element={<InstallHelp />} />
      </Routes>
      <UpdatePrompt />
      {showNav && <BottomNav />}
    </>
  )
}
