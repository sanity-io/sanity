import {type ButtonMode, type ButtonTone, Card, type CardTone} from '@sanity/ui'
import {type ComponentType, type ElementType, type ReactNode} from 'react'
import {useWorkspace} from 'sanity'
import {Box, Flex, Icon} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'

interface BannerProps {
  action?: {
    as?: ElementType | keyof React.JSX.IntrinsicElements
    icon?: ComponentType
    onClick?: () => void
    text: string
    tone?: ButtonTone
    disabled?: boolean
    mode?: ButtonMode
  }
  /** Several controls in the action column, for a banner with more than one action. Use instead of `action`. */
  actions?: ReactNode
  content: ReactNode
  icon?: ComponentType
  tone?: CardTone
  paddingY?: number
}

/** The narrowest the text gets before the actions move under it */
const TEXT_MIN_WIDTH = '280px'
/** The widest the text gets, so lines stay readable in a wide pane */
const TEXT_MAX_WIDTH = '720px'

/**
 * The card that resets a banner's tint around a filled action: no fill, no shadow and no box of
 * its own. It is a flex box so the button is a flex item, not inline content on a text line.
 */
const NEUTRAL_ACTION_STYLE = {
  background: 'transparent',
  boxShadow: 'none',
  display: 'flex',
  alignItems: 'center',
  flex: 'none',
} as const

function getIconTone(tone: CardTone) {
  return tone === 'default' || tone === 'inherit' || tone === 'primary' || tone === 'transparent'
    ? undefined
    : tone
}

function BannerIconView({icon, tone}: {icon: ComponentType; tone: CardTone}) {
  return (
    <Icon
      muted={!(tone === 'inherit' || tone === 'primary')}
      size={0}
      icon={icon}
      tone={getIconTone(tone)}
      style={{
        margin: '-0.3125rem',
        ...((tone === 'inherit' || tone === 'primary') && {
          color: 'var(--card-icon-color)',
        }),
      }}
    />
  )
}

/**
 * With Variants on, the text is capped at 720px and the actions sit at the right edge; they move
 * under the text when they would leave it narrower than 280px. A filled action is the neutral
 * default primary. With Variants off the banner keeps its earlier one-row layout.
 */
export function Banner(props: BannerProps) {
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)
  if (!variantsEnabled) return <LegacyBanner {...props} />

  const {
    action,
    actions,
    content,
    icon: BannerIcon,
    tone = 'transparent',
    paddingY = 2,
    ...rest
  } = props

  return (
    <Box padding={1}>
      <Card radius={3} paddingX={2} paddingY={paddingY} tone={tone} {...rest}>
        {/* Always wraps: the text asks for at least 280px, so the actions go under it only when
            the banner is too narrow for both. space-between puts the actions at the right edge
            when they share the line, and at the start of their own line when they wrap. */}
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          columnGap={4}
          paddingX={2}
        >
          <Flex
            gap={3}
            flexGrow={1}
            flexShrink={1}
            flexBasis={TEXT_MIN_WIDTH}
            minWidth="0"
            maxWidth={TEXT_MAX_WIDTH}
          >
            {BannerIcon && (
              // Top aligned with the text's first line
              <Box flexShrink={0} paddingTop={2}>
                <BannerIconView icon={BannerIcon} tone={tone} />
              </Box>
            )}
            <Flex
              alignItems="center"
              flexWrap="wrap"
              gap={2}
              flexGrow={1}
              flexBasis="0%"
              minWidth="0"
              paddingY={2}
              style={{textWrap: 'balance'}}
            >
              {content}
            </Flex>
          </Flex>

          {actions && !action && (
            <Flex alignItems="center" flexWrap="wrap" gap={2} flexShrink={0}>
              {actions}
            </Flex>
          )}

          {action && (
            <Flex alignItems="center" flexShrink={0}>
              {action.mode === 'default' ? (
                /*
                  A filled (primary) action is the default primary (black in light mode, white in
                  dark) whatever the banner's tint. A button takes its colours from the card around
                  it, so it sits on a neutral card; any tone but critical is the default tone.
                */
                <Card tone="default" style={NEUTRAL_ACTION_STYLE}>
                  <Button
                    {...action}
                    mode="default"
                    tone={action.tone === 'critical' ? 'critical' : 'default'}
                  />
                </Card>
              ) : (
                // A ghost or bleed (secondary) action keeps its tone and the banner's tint
                <Button {...action} mode={action.mode || 'ghost'} tone={action.tone || 'default'} />
              )}
            </Flex>
          )}
        </Flex>
      </Card>
    </Box>
  )
}

/** The banner as it is with Variants off: one row, the actions inline after the text. */
function LegacyBanner(props: BannerProps) {
  const {
    action,
    actions,
    content,
    icon: BannerIcon,
    tone = 'transparent',
    paddingY = 2,
    ...rest
  } = props

  return (
    <Box padding={1}>
      <Card radius={3} paddingX={2} paddingY={paddingY} tone={tone} {...rest}>
        <Flex alignItems="center" gap={3} paddingX={2}>
          {BannerIcon && <BannerIconView icon={BannerIcon} tone={tone} />}

          {/* Several actions sit right after the text, 8px apart, as they did before `actions` existed */}
          <Flex alignItems="center" flexBasis="0%" flexGrow={1} gap={2} paddingY={2}>
            {content}
            {actions && !action && actions}
          </Flex>

          {action && (
            <Button {...action} mode={action.mode || 'ghost'} tone={action.tone || 'default'} />
          )}
        </Flex>
      </Card>
    </Box>
  )
}
