import {type ReactNode, useMemo} from 'react'
import {DocumentIdContext} from 'sanity/_singletons'

export function DocumentIdOverrideProvider(props: {id: string | undefined; children: ReactNode}) {
  const value = useMemo(() => (props.id === undefined ? null : {id: props.id}), [props.id])

  if (!value) {
    return props.children
  }

  return <DocumentIdContext.Provider value={value}>{props.children}</DocumentIdContext.Provider>
}
