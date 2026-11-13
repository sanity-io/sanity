import {type ButtonMode, type ButtonTone, Card, type CardTone} from '@sanity/ui'
import {type ComponentType, type ElementType, type ReactNode} from 'react'
import {Box, Icon} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {
  action as actionSlot,
  actionGroup,
  content as contentColumn,
  icon as iconCell,
  reservedAction,
  root,
  row,
  text,
} from './Banner.css'

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
  /**
   * Several controls in the action column, for a banner with more than one action. Use instead of
   * `action`. Wrap a filled primary in `<BannerPrimaryAction>` so it is the default primary.
   */
  actions?: ReactNode
  content: ReactNode
  /**
   * Keeps the action's space but hides it (not seen, focused or announced), so a banner that hands
   * its action elsewhere for a while keeps its height and its text wraps as before, and nothing
   * below it moves when the action comes back.
   */
  reserveAction?: boolean
  icon?: ComponentType
  tone?: CardTone
  paddingY?: number
}

/** The card that resets a banner's tint around its action: no fill, no shadow of its own. */
const NEUTRAL_ACTION_STYLE = {background: 'transparent', boxShadow: 'none', flex: 'none'} as const

/**
 * Wraps a filled (primary) button in a banner's `actions` so it is the default primary (black in
 * light mode, white in dark) whatever the banner's tint, like `action` with `mode: 'default'`.
 */
export function BannerPrimaryAction(props: {children: ReactNode}) {
  return (
    <Card tone="default" style={NEUTRAL_ACTION_STYLE}>
      {props.children}
    </Card>
  )
}

export function Banner(props: BannerProps) {
  const {
    action,
    actions,
    content,
    reserveAction = false,
    icon: BannerIcon,
    tone = 'transparent',
    paddingY = 2,
    ...rest
  } = props
  const iconTone =
    tone === 'default' || tone === 'inherit' || tone === 'primary' || tone === 'transparent'
      ? undefined
      : tone

  return (
    <Box padding={1}>
      <Card radius={3} paddingX={2} paddingY={paddingY} tone={tone} {...rest}>
        {/* The text is at most 720px and wraps, and the action's column hugs its button, 16px after the text and at the
            right edge; a banner with no action has no column. On a narrow banner the action goes under the text. */}
        <div className={root}>
          <div className={row}>
            <div className={text}>
              {BannerIcon && (
                <div className={iconCell}>
                  <Icon
                    muted={!(tone === 'inherit' || tone === 'primary')}
                    size={0}
                    icon={BannerIcon}
                    tone={iconTone}
                    style={{
                      margin: '-0.3125rem',
                      ...((tone === 'inherit' || tone === 'primary') && {
                        color: 'var(--card-icon-color)',
                      }),
                    }}
                  />
                </div>
              )}
              <div className={contentColumn}>{content}</div>
            </div>
            {actions && !action && (
              <div className={actionSlot}>
                <div className={actionGroup}>{actions}</div>
              </div>
            )}
            {action && (
              <div
                aria-hidden={reserveAction || undefined}
                className={reserveAction ? `${actionSlot} ${reservedAction}` : actionSlot}
                data-reserved={reserveAction || undefined}
                inert={reserveAction || undefined}
              >
                {action.mode === 'default' ? (
                  /*
                    A filled (primary) action is the default primary (black in light mode, white in
                    dark) whatever the banner's tint or tone. A button takes its colours from the card
                    around it, so it sits on a neutral card that resets the tint, and any tone but
                    critical is the default tone. The banner keeps its own tint, icon and text colour.
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
                  <Button
                    {...action}
                    mode={action.mode || 'ghost'}
                    tone={action.tone || 'default'}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Box>
  )
}
