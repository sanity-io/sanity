// oxlint-disable-next-line no-restricted-imports -- This has some special implementation needed from @sanity/ui
import {Dialog} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {appDialog, fullSurfaceAppDialog} from './Dialog.css'

export function AppDialog(props: ComponentProps<typeof Dialog>) {
  const {className, ...rest} = props
  return <Dialog {...rest} className={clsx(appDialog, className)} />
}

/**
 * Full-surface variant for the federated view dialogs: the view mounts the
 * whole Media Library app (folder nav, grid, detail sidebar), so the dialog
 * fills the studio surface — the 1.5rem padding above is the only margin —
 * instead of stopping at the `width` prop's container scale (which caps at
 * 1920px and reads as a centered box on wider displays). The explicit
 * max-width keeps it sane on ultrawide monitors.
 */
export function FullSurfaceAppDialog(props: ComponentProps<typeof Dialog>) {
  const {className, ...rest} = props
  return <AppDialog {...rest} className={clsx(fullSurfaceAppDialog, className)} />
}
