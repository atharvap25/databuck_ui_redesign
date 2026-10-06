import { useState } from 'react'
import AppShell, { type LayoutId } from './components/AppShell.tsx'
import LoginScreen from './components/LoginScreen.tsx'
import { AdminProvider } from './admin/adminStore.ts'
import { JobsProvider } from './jobs/jobStore.ts'

type View = 'login' | LayoutId

export default function App() {
  const [view, setView] = useState<View>('login')

  if (view === 'login') {
    return <LoginScreen onOpenLayout={setView} />
  }

  return (
    <JobsProvider>
      <AdminProvider>
        <AppShell layout={view} onLogout={() => setView('login')} />
      </AdminProvider>
    </JobsProvider>
  )
}
