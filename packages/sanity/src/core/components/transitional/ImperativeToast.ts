import {useToast} from '@sanity/ui'
import {forwardRef, type ReactNode, useImperativeHandle} from 'react'

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
export const ImperativeToast = forwardRef((_, ref) => {
  const {push} = useToast()

  useImperativeHandle(ref, () => ({push}))

  return null
})

ImperativeToast.displayName = 'ForwardRef(ImperativeToast)'
