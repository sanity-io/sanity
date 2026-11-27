import {type ReactNode} from 'react'
import {Flex} from 'ui5'

import {cx} from '../util/cx'
import * as styles from './redesign.module.css'

/**
 * The bottom action bar of the request panel. Fetch comes first, then Live fetch, as the classic
 * tool's Fetch and Listen buttons led its footer; the request chips sit at the right end.
 */
export function ActionRail({children, testId}: {children: ReactNode; testId: string}) {
  return (
    <Flex
      alignItems="center"
      className={cx(styles.actionRail, styles.bottomBar)}
      data-testid={testId}
      gap={2}
      justifyContent="flex-end"
      paddingX={2}
    >
      {children}
    </Flex>
  )
}
