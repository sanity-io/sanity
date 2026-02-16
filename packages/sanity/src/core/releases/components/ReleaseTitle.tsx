import {Box, Text, type TextProps} from '@sanity/ui'
import {type CSSProperties, type ReactElement, type ReactNode} from 'react'

import {Tooltip} from '../../../ui-components'
import {getReleaseTitleDetails} from '../util/getReleaseTitleDetails'

/** @internal */
export interface ReleaseTitleDetails {
  displayTitle: string
  fullTitle: string
  isTruncated: boolean
}

/** @internal */
export interface ReleaseTitleProps {
  title: string | undefined
  fallback: string
  enableTooltip?: boolean
  tooltipMaxWidth?: string
  children?: (details: ReleaseTitleDetails) => ReactElement
  textProps?: Omit<TextProps, 'children'> & {style?: CSSProperties}
}

const DEFAULT_TOOLTIP_MAX_WIDTH = '300px'

/** @internal */
export function ReleaseTitle(props: ReleaseTitleProps): ReactNode {
  const {title, fallback, enableTooltip = true, tooltipMaxWidth, children, textProps} = props
  const {displayTitle, fullTitle, isTruncated} = getReleaseTitleDetails(title, fallback)

  const renderedContent: ReactElement = children ? (
    children({displayTitle, fullTitle, isTruncated})
  ) : (
    <Text {...textProps}>{displayTitle}</Text>
  )

  if (isTruncated && enableTooltip) {
    return (
      <Tooltip
        content={
          <Box style={{maxWidth: tooltipMaxWidth ?? DEFAULT_TOOLTIP_MAX_WIDTH}}>
            <Text size={1}>{fullTitle}</Text>
          </Box>
        }
      >
        {renderedContent}
      </Tooltip>
    )
  }

  return renderedContent
}
