import {createContext, useContext} from 'react'
import {FieldProps} from 'sanity'

interface CommentsFieldContextValue {
  path: FieldProps['path']
}

const CommentsFieldContext = createContext<CommentsFieldContextValue | null>(null)

interface CommentsFieldProviderProps {
  children: React.ReactNode
  path: FieldProps['path']
}

export function CommentsFieldProvider(props: CommentsFieldProviderProps) {
  const {children, path} = props

  return <CommentsFieldContext.Provider value={{path}}>{children}</CommentsFieldContext.Provider>
}

export function useCommentsField() {
  const ctx = useContext(CommentsFieldContext)

  if (!ctx) {
    throw new Error('useCommentsField must be used within a CommentsFieldProvider')
  }

  return ctx
}
