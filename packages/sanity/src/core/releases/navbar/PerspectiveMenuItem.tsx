import {DotIcon, EyeClosedIcon, EyeOpenIcon, LockIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- custom use for MenuItem & Button not supported by ui-components
import {type BadgeTone, Box, Button, Flex, MenuItem, Stack, Text} from '@sanity/ui'
import {type CSSProperties, forwardRef, type MouseEvent} from 'react'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../ui-components/tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {formatRelativeLocale} from '../../util/formatRelativeLocale'
import {ReleaseAvatar} from '../components/ReleaseAvatar'
import {GlobalPerspectiveMenuItemIndicator} from './PerspectiveLayerIndicator'

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

export function getRangePosition(range: LayerRange, index: number): rangePosition {
  const {firstIndex, lastIndex} = range

  if (firstIndex === lastIndex) return undefined
  if (index === firstIndex) return 'first'
  if (index === lastIndex) return 'last'
  if (index > firstIndex && index < lastIndex) return 'within'

  return undefined
}

export const PerspectiveMenuItem = forwardRef<
  HTMLDivElement,
  {
    title: string
    canBeExcluded: boolean
    active?: boolean
    locked?: boolean
    date?: Date
    tone: BadgeTone
    excluded?: boolean
    extraPadding?: boolean
    rangePosition: rangePosition
    onToggleVisibility: (event: MouseEvent<HTMLDivElement>) => void
    onClick: () => void
  }
>((props, ref) => {
  const {
    canBeExcluded,
    locked,
    date,
    rangePosition,
    active,
    tone,
    title,
    excluded,
    extraPadding,
    onToggleVisibility,
    onClick,
  } = props

  const first = rangePosition === 'first'
  const within = rangePosition === 'within'
  const last = rangePosition === 'last'
  const inRange = first || within || last

  const {t} = useTranslation()

  return (
    <GlobalPerspectiveMenuItemIndicator
      $extraPadding={extraPadding}
      $first={first}
      $last={last}
      $inRange={inRange}
      ref={ref}
    >
      <MenuItem onClick={onClick} padding={1} pressed={active}>
        <Flex align="flex-start" gap={1}>
          <Box
            flex="none"
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Text size={1}>{excluded ? <ExcludedLayerDot /> : <ReleaseAvatar tone={tone} />}</Text>
          </Box>
          <Stack
            flex={1}
            paddingY={2}
            paddingRight={2}
            space={2}
            style={{
              opacity: excluded ? 0.5 : undefined,
            }}
          >
            <Text size={1} weight="medium">
              {title}
            </Text>
            {date && (
              <Text muted size={1}>
                {formatRelativeLocale(date, new Date())}
              </Text>
            )}
          </Stack>
          <Box flex="none">
            {canBeExcluded && (
              <Tooltip portal content={t('release.layer.hide')} placement="bottom">
                <ToggleLayerButton
                  $visible={!excluded}
                  forwardedAs="div"
                  icon={excluded ? EyeClosedIcon : EyeOpenIcon}
                  mode="bleed"
                  onClick={onToggleVisibility}
                  padding={2}
                />
              </Tooltip>
            )}
            {locked && (
              <Box padding={2}>
                <Text size={1}>
                  <LockIcon />
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </MenuItem>
    </GlobalPerspectiveMenuItemIndicator>
  )
})

PerspectiveMenuItem.displayName = 'GlobalPerspectiveMenuItem'
