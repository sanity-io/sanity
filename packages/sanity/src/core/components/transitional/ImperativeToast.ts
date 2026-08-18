import {useToast} from '@sanity/ui/toast'
import {type ReactNode, type Ref, useImperativeHandle} from 'react'

/** @internal */
export interface ToastParams {
  closable?: boolean
  description?: ReactNode
  duration?: number
  onClose?: () => void
  title?: ReactNode
  status?: 'error' | 'warning' | 'success' | 'info'
}

/**
 * @internal
 * @deprecated -- Refactor the component so it can call `useToast` instead
 */
export function ImperativeToast({ref}: {ref?: Ref<{push: (params: ToastParams) => string}>}) {
  const {push} = useToast()

  useImperativeHandle(ref, () => ({push}))

  return null
}

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
ImperativeToast.displayName = 'ImperativeToast'
