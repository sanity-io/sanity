import {memo, type ReactNode} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument, type releaseType} from '../../../../../../core'
import {Button, Tooltip} from '../../../../../../ui-components'

const Chip = styled(Button)`
  border-radius: 9999px !important;
  transition: none;
  text-decoration: none !important;
  cursor: pointer;

  // target enabled state
  &:not([data-disabled='true']) {
    --card-border-color: var(--card-badge-default-bg-color);
  }
`

export const VersionChip = memo(function VersionChip(props: {
  disabled?: boolean
  releaseOptions?: BundleDocument[]
  selected: boolean
  tooltipContent: ReactNode
  version?: releaseType
  onClick: () => void
  text: string
  tone: 'default' | 'primary' | 'positive' | 'caution' | 'critical'
  icon: React.ComponentType
}) {
  const {disabled, releaseOptions, selected, tooltipContent, version, onClick, text, tone, icon} =
    props

  return (
    <>
      <Tooltip content={tooltipContent} fallbackPlacements={[]} portal placement="bottom">
        <Chip
          disabled={disabled}
          mode="bleed"
          onClick={onClick}
          padding={2}
          paddingRight={3}
          radius="full"
          selected={selected}
          style={{flex: 'none'}}
          text={text}
          tone={tone}
          icon={icon}
        />
      </Tooltip>
    </>
  )
})
