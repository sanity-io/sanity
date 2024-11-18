import {DotIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- custom use for MenuItem & Button not supported by ui-components
import {Box, Button, Text} from '@sanity/ui'
import {type CSSProperties, forwardRef, type MouseEvent, useCallback} from 'react'
import {css, styled} from 'styled-components'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useStudioPerspectiveState} from '../hooks/useStudioPerspectiveState'
import {getPerspectiveTone} from '../util/getReleaseTone'
import {type PublishedPerspective} from '../util/perspective'
import {PerspectiveMenuItem} from './PerspectiveMenuItem'

export interface LayerRange {
  firstIndex: number
  lastIndex: number
  offsets: {
    asap: number
    scheduled: number
    undecided: number
  }
}

const ToggleLayerButton = styled(Button)<{$visible: boolean}>(
  ({$visible}) => css`
    --card-fg-color: inherit;
    --card-icon-color: inherit;

    background-color: inherit;
    opacity: ${$visible ? 0 : 1};

    @media (hover: hover) {
      &:not([data-disabled='true']):hover {
        --card-fg-color: inherit;
        --card-icon-color: inherit;
      }
    }

    [data-ui='MenuItem']:hover & {
      opacity: 1;
    }
  `,
)

const ExcludedLayerDot = () => (
  <Box padding={3}>
    <Text size={1}>
      <DotIcon
        style={
          {
            opacity: 0,
          } as CSSProperties
        }
      />
    </Text>
  </Box>
)

type rangePosition = 'first' | 'within' | 'last' | undefined

export const GlobalPublishedPerspectiveMenuItem = forwardRef<
  HTMLDivElement,
  {
    perspective: PublishedPerspective
    rangePosition: rangePosition
  }
>((props, ref) => {
  const {perspective, rangePosition} = props
  const {current, setCurrent, toggle, excluded} = useStudioPerspectiveState()

  const active = perspective === current
  const first = rangePosition === 'first'
  const within = rangePosition === 'within'
  const last = rangePosition === 'last'
  const inRange = first || within || last

  const {t} = useTranslation()

  const isReleasePerspectiveExcluded = excluded.includes(perspective)

  const handleToggleReleaseVisibility = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation()
      toggle(perspective)
    },
    [perspective, toggle],
  )

  const handleOnReleaseClick = useCallback(() => setCurrent(perspective), [perspective, setCurrent])

  const canReleaseBeExcluded = inRange && !last

  return (
    <PerspectiveMenuItem
      onClick={handleOnReleaseClick}
      tone={getPerspectiveTone(perspective)}
      onToggleVisibility={handleToggleReleaseVisibility}
      title={t('release.navbar.published')}
      active={active}
      excluded={isReleasePerspectiveExcluded}
      canBeExcluded={canReleaseBeExcluded}
      rangePosition={rangePosition}
      extraPadding
    />
  )
})

GlobalPublishedPerspectiveMenuItem.displayName = 'GlobalPerspectiveMenuItem'
