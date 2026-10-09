import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Button} from '@sanity/ui'
import {type CSSProperties, type ReactNode, type RefObject} from 'react'
import {Box, Flex} from 'ui5'

import {cx} from '../util/cx'
import {PANEL_HEADER_HEIGHT} from './CollapsiblePanel'
import {collapsibleSection, sectionBody} from './vista.css'

export interface CollapsibleSectionProps {
  /** Prefix for the element ids and test ids */
  id: string
  title: string
  /** Rendered after the title, for instance a warning icon */
  icon?: ReactNode
  expanded: boolean
  onToggle: () => void
  /** Sizing of the expanded section */
  className?: string
  style?: CSSProperties
  ref?: RefObject<HTMLElement | null>
  /** Rendered before the header, positioned by the caller (a resize handle) */
  handle?: ReactNode
  children: ReactNode
}

/**
 * A titled, collapsible panel stacked under the query editor. Collapsed, only the header row
 * remains; its height is {@link PANEL_HEADER_HEIGHT} like the response column's tabbed panel.
 */
export function CollapsibleSection(props: CollapsibleSectionProps) {
  const {id, title, icon, expanded, onToggle, className, style, ref, handle, children} = props

  return (
    <Flex
      as="section"
      className={cx(collapsibleSection, expanded && className)}
      data-expanded={expanded}
      data-testid={`${id}-panel`}
      ref={ref}
      style={expanded ? style : undefined}
    >
      {handle}
      <Flex
        alignItems="center"
        borderBottom={expanded}
        flexShrink={0}
        gap={1}
        height={`${PANEL_HEADER_HEIGHT}px`}
        paddingX={2}
      >
        <Button
          aria-controls={`${id}-content`}
          aria-expanded={expanded}
          data-testid={`${id}-toggle`}
          fontSize={1}
          icon={expanded ? ChevronDownIcon : ChevronRightIcon}
          id={`${id}-toggle`}
          mode="bleed"
          onClick={onToggle}
          padding={2}
          text={title}
        />
        {icon}
      </Flex>
      {expanded && (
        <Box
          aria-labelledby={`${id}-toggle`}
          className={sectionBody}
          id={`${id}-content`}
          role="region"
        >
          {children}
        </Box>
      )}
    </Flex>
  )
}
