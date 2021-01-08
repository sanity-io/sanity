// This is transitional in order to track usage of the Snackbar part from within the form-builder package
import SnackbarPart from 'part:@sanity/components/snackbar/default'
import React from 'react'

interface Props {
  kind?: 'info' | 'warning' | 'error' | 'success'
  title?: React.ReactNode
  subtitle?: React.ReactNode
  isPersisted?: boolean
  onAction?: () => void
  actionTitle?: string
}

export function Snackbar(props: Props) {
  return <SnackbarPart {...props} />
}
