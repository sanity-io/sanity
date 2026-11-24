import {type ReactNode} from 'react'
import {Flex} from 'ui5'

import {cx} from '../util/cx'
import * as styles from './redesign.module.css'

/**
 * The bottom action bar of the request and response panels, following the structure tool's
 * document status bar: a primary CTA (with text and icon) and a show-more menu button.
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
