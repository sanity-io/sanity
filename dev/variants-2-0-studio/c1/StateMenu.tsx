import {type ReactElement, forwardRef} from 'react'
import {GlobalPerspectiveMenu, ReleaseAvatarIcon, useActiveReleases, usePerspective} from 'sanity'

import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'

/**
 * A control of the navbar or the row, composed from the real `Button` (ui-components): radius 3, a border, a left
 * icon, a label and a chevron. (Storybook exploration, perspective/StateMenu.tsx @ 2700f4cf07; the Figma library
 * calls it `PerspectiveSelectorDimension.Button` and it has no code twin in the Studio source.)
 */
interface DimensionButtonProps {
  'icon': ReactElement | (() => ReactElement)
  'text': string
  'open'?: boolean
  'selected'?: boolean
  'testId': string
  'maxWidth'?: number
  'onClick'?: () => void
  'title'?: string
  'aria-expanded'?: boolean
  /** `round` matches the stock Drafts pill (full radius); `box` is the 3px control the row uses. */
  'shape'?: 'round' | 'box'
}

export const DimensionButton = forwardRef<HTMLButtonElement, DimensionButtonProps>(
  function DimensionButton(props, ref) {
    const {icon, text, open, selected, testId, maxWidth = 260, shape = 'box', ...rest} = props
    return (
      <Button
        {...rest}
        data-testid={testId}
        icon={icon}
        iconRight={open ? ChevronUpIcon : ChevronDownIcon}
        mode="ghost"
        radius={shape === 'round' ? 'full' : undefined}
        ref={ref}
        selected={selected}
        style={shape === 'round' ? {maxWidth} : {maxWidth, borderRadius: 6}}
        text={text}
        tooltipProps={null}
      />
    )
  },
)

/** The icon of a version: the real release avatar for Published, Drafts or a release (LIVE: from the real releases). */
export function VersionGlyph({version}: {version: string}) {
  const {data: releases} = useActiveReleases()
  const release =
    version === 'published' || version === 'drafts'
      ? version
      : (releases?.find((r) => r._id.replace(/^_\.releases\./, '') === version) ?? 'drafts')
  return <ReleaseAvatarIcon release={release} />
}

/** LIVE: the real perspective menu, unchanged, with a trigger. It sets the real Studio perspective itself. */
export function StateMenu(props: {trigger: ReactElement}) {
  const {selectedPerspectiveName} = usePerspective()
  return (
    <GlobalPerspectiveMenu
      areReleasesEnabled
      selectedPerspectiveName={selectedPerspectiveName}
      trigger={props.trigger}
    />
  )
}
