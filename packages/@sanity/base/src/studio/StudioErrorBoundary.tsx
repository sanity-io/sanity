import React, {useState} from 'react'
import {ErrorBoundary} from '@sanity/ui'
import {SchemaError} from '../config'
import {isRecord} from '../util'
import {SchemaErrorsScreen} from './screens'

interface StudioErrorBoundaryProps {
  children: React.ReactNode
}

export function StudioErrorBoundary({children}: StudioErrorBoundaryProps) {
  const [{error}, setError] = useState<{error: unknown}>({error: null})

  const message = isRecord(error) && typeof error.message === 'string' && error.message
  const stack = isRecord(error) && typeof error.stack === 'string' && error.stack

  if (error instanceof SchemaError) {
    return <SchemaErrorsScreen schema={error.schema} />
  }

  if (error) {
    return (
      <>
        TODO: better error boundary
        <button
          type="button"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => setError({error: null})}
        >
          retry
        </button>
        {message && <pre>{message}</pre>}
        {stack && <pre>{stack}</pre>}
      </>
    )
  }

  return <ErrorBoundary onCatch={setError}>{children}</ErrorBoundary>
}
