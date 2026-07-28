import {createContext, type ReactNode, useContext, useMemo, useState} from 'react'

export interface DemoDebugInfo {
  query: string
  params: Record<string, unknown>
  requestOptions: Record<string, unknown>
  response: unknown
}

interface DemoState {
  variant: string
  setVariant: (value: string) => void
  lang: string
  setLang: (value: string) => void
  showSwitcher: boolean
  setShowSwitcher: (value: boolean) => void
  showDebug: boolean
  setShowDebug: (value: boolean) => void
  debugInfo: DemoDebugInfo | undefined
  setDebugInfo: (value: DemoDebugInfo) => void
}

const DemoStateContext = createContext<DemoState | undefined>(undefined)

// Shared across every route so the "Viewing as" / Language selection persists
// when navigating from the landing page into a product detail page.
export function DemoStateProvider({children}: {children: ReactNode}) {
  const [variant, setVariant] = useState('')
  const [lang, setLang] = useState('en')
  const [showSwitcher, setShowSwitcher] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DemoDebugInfo | undefined>(undefined)

  const value = useMemo(
    () => ({
      variant,
      setVariant,
      lang,
      setLang,
      showSwitcher,
      setShowSwitcher,
      showDebug,
      setShowDebug,
      debugInfo,
      setDebugInfo,
    }),
    [variant, lang, showSwitcher, showDebug, debugInfo],
  )

  return <DemoStateContext.Provider value={value}>{children}</DemoStateContext.Provider>
}

export function useDemoState(): DemoState {
  const ctx = useContext(DemoStateContext)
  if (!ctx) throw new Error('useDemoState must be used within a DemoStateProvider')
  return ctx
}
