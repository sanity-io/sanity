import {useToast} from '@sanity/ui'
import type React from 'react'
import {forwardRef, useImperativeHandle} from 'react'

export interface ToastParams {
  closable?: boolean
  description?: React.ReactNode
  duration?: number
  onClose?: () => void
  title?: React.ReactNode
  status?: 'error' | 'warning' | 'success' | 'info'
}

export const ImperativeToast = forwardRef((_, ref) => {
  const {push} = useToast()

  useImperativeHandle(ref, () => ({push}))

  return null
})

ImperativeToast.displayName = 'ImperativeToast'
