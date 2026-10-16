import {Code} from '@sanity/ui/code'
import {type ComponentProps} from 'react'

import styles from './QueryErrorDialog.module.css'

export function ErrorCode(props: ComponentProps<typeof Code>) {
  return <Code {...props} className={styles.errorCode} />
}
