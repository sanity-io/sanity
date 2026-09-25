import {type ReactNode} from 'react'
import {Flex} from 'ui5'

/** The vertical column of icon-only actions beside an editor or result view */
export function ActionRail({children, testId}: {children: ReactNode; testId: string}) {
  return (
    <Flex
      alignItems="center"
      data-testid={testId}
      flexDirection="column"
      flexShrink={0}
      gap={1}
      padding={1}
    >
      {children}
    </Flex>
  )
}
