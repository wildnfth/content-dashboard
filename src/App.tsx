import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ToastViewport } from '@/components/ToastViewport'
import { useAuthSession } from '@/hooks/useAuthSession'

const AppShell = lazy(async () => ({
  default: (await import('@/app/AppShell')).AppShell,
}))
const LoginScreen = lazy(async () => ({
  default: (await import('@/screens/LoginScreen')).LoginScreen,
}))
const OperasionalScreen = lazy(async () => ({
  default: (await import('@/screens/OperasionalScreen')).OperasionalScreen,
}))
const InsightScreen = lazy(async () => ({
  default: (await import('@/screens/InsightScreen')).InsightScreen,
}))

function App() {
  const auth = useAuthSession()

  if (auth.status === 'loading') {
    return (
      <div className="app-loading">
        <div className="app-loading__seal">LM</div>
        <p>Menyiapkan dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="app-loading">
            <div className="app-loading__seal">LM</div>
            <p>Membuka workspace...</p>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to={auth.session ? '/app/operasional' : '/login'} replace />} />
          <Route path="/login" element={auth.session ? <Navigate to="/app/operasional" replace /> : <LoginScreen />} />
          <Route path="/app" element={auth.session ? <AppShell /> : <Navigate to="/login" replace />}>
            <Route index element={<Navigate to="operasional" replace />} />
            <Route path="operasional" element={<OperasionalScreen />} />
            <Route path="insight" element={<InsightScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastViewport />
    </>
  )
}

export default App
