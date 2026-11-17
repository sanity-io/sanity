import {Box} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useState} from 'react'
import {Text} from 'ui5'

import {relativeDate} from './dates'

/**
 * "3 days ago" with the absolute date+time in a tooltip. "Now" is sampled
 * once per mount (lazy init — render-time Date.now() is impure under the
 * React Compiler); these views are short-lived enough that a ticking clock
 * isn't worth the re-renders.
 */
export function RelativeDate(props: {dateTime: string; size?: 0 | 1; muted?: boolean}) {
  const {dateTime, size = 1, muted} = props
  const [now] = useState(() => Date.now())
  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1} as="div" trim={true}>
            {new Date(dateTime).toLocaleString()}
          </Text>
        </Box>
      }
    >
      <Text size={size} muted={muted} as="div" trim={true}>
        {relativeDate(dateTime, now)}
      </Text>
    </Tooltip>
  )
}
