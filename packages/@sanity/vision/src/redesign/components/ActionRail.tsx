import {type ReactNode} from 'react'
import {Flex} from 'ui5'

/**
 * The bottom action bar of the request and response panels, following the structure tool's
 * document status bar: a primary CTA (with text and icon) and a show-more menu button.
 */
export function ActionRail({children, testId}: {children: ReactNode; testId: string}) {
  return (
    <Flex
      alignItems="center"
      borderTop
      data-testid={testId}
      flexShrink={0}
      gap={2}
      justifyContent="flex-end"
      padding={2}
    >
      {children}
    </Flex>
  )
}
