import { createContext, useContext, useMemo, useState } from 'react'

const DemoContext = createContext(null)

export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const toggleDemoMode = () => setIsDemoMode(value => !value)
  const value = useMemo(() => ({
    isDemoMode,
    toggleDemoMode,
    demoDeviceId: 'srv-001',
    demoScenario: 'high-cpu-overload',
  }), [isDemoMode])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemoMode() {
  return useContext(DemoContext)
}
