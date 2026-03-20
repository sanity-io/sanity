// eslint-disable-next-line no-restricted-imports -- This has some special implementation needed from @sanity/ui
import {Dialog} from '@sanity/ui'
import {type ComponentProps, forwardRef} from 'react'

import {appDialog} from './Dialog.css'

export const AppDialog = forwardRef<HTMLDivElement, ComponentProps<typeof Dialog>>(
  function AppDialog(props, ref) {
    return <Dialog {...props} className={appDialog} ref={ref} />
  },
)
