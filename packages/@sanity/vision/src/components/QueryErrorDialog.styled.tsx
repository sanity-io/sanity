import {Code} from '@sanity/ui'
import {type ComponentProps} from 'react'

import {errorCode} from './QueryErrorDialog.css'

export function ErrorCode(props: ComponentProps<typeof Code>) {
  return <Code {...props} className={errorCode} />
}
