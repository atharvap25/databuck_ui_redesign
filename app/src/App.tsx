import { useState } from 'react'
import AppShell, { type LayoutId } from './components/AppShell.tsx'
import LoginScreen from './components/LoginScreen.tsx'

type View = 'login' | LayoutId

export default function App() {
  const [view, setView] = useState<View>('login')

  if (view === 'login') {
    return <LoginScreen onOpenLayout={setView} />
  }

  return <AppShell layout={view} onLogout={() => setView('login')} />
}
