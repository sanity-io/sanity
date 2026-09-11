// oxlint-disable-next-line no-restricted-imports -- This has some special implementation needed from @sanity/ui
import {Dialog} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {appDialog} from './Dialog.css'

export function AppDialog(props: ComponentProps<typeof Dialog>) {
  const {className, ...rest} = props
  return <Dialog {...rest} className={clsx(appDialog, className)} />
}
