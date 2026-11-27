import {type Dispatch, type SetStateAction, useEffect, useState} from 'react'

export function useLocalState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() =>
    JSON.parse(localStorage.getItem(key) ?? JSON.stringify(defaultValue)),
  )

  useEffect(() => {
    // Leave the default unstored until the value changes, so a changed default still applies
    if (value === defaultValue && localStorage.getItem(key) === null) return
    localStorage.setItem(key, JSON.stringify(value))
  }, [defaultValue, key, value])

  return [value, setValue]
}
