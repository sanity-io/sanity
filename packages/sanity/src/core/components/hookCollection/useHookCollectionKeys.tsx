import {useCallback, useState} from 'react'

export function useHookCollectionKeys(onReset: (() => void) | undefined) {
  const [keys, setKeys] = useState<Record<string, number>>({})

  const handleReset = useCallback(
    (id: string) => {
      setKeys((currentKeys) => ({...currentKeys, [id]: (currentKeys[id] || 0) + 1}))
      onReset?.()
    },
    [onReset],
  )

  return {keys, handleReset}
}
