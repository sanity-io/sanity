import {Code, type CodeProps} from 'ui5'

import * as styles from './QueryErrorDialog.module.css'

export function ErrorCode(props: CodeProps) {
  return <Code {...props} className={styles.errorCode} trim />
}
