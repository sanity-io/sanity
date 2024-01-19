import {useToast} from '@sanity/ui'
import {ReactNode, forwardRef, useImperativeHandle} from 'react'

/** @internal */
export interface ToastParams {
  closable?: boolean
  description?: ReactNode
  duration?: number
  onClose?: () => void
  title?: ReactNode
  status?: 'error' | 'warning' | 'success' | 'info'
}

/** @internal */
export const ImperativeToast = forwardRef((_, ref) => {
  const {push} = useToast()

  useImperativeHandle(ref, () => ({push}))

  return null
})

ImperativeToast.displayName = 'ImperativeToast'
