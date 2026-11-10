import {type BadgeTone} from '@sanity/ui'
import {Chip, ReleaseAvatarIcon, type TargetPerspective} from 'sanity'

/** @internal */
export interface NavigationBadgeProps {
  /** The selected variant has a version in this bundle. Inactive badges stay clickable. */
  'active': boolean
  /** The perspective the badge's dot stands for. */
  'avatar': TargetPerspective
  'data-testid': string
  'onClick': () => void
  'selected': boolean
  'text': string
  /** Tone of an active badge. Inactive badges are neutral. */
  'tone': BadgeTone
}

/**
 * A bundle of the document in the selected variant: the dot of its perspective and its name. It
 * only displays and selects; the version actions live in the document group inventory.
 *
 * @internal
 */
export function NavigationBadge(props: NavigationBadgeProps) {
  const {active, avatar, onClick, selected, text, tone} = props

  return (
    <Chip
      data-active={active ? '' : undefined}
      data-testid={props['data-testid']}
      icon={<ReleaseAvatarIcon release={avatar} />}
      mode="bleed"
      onClick={onClick}
      selected={selected}
      text={text}
      tone={active ? tone : 'default'}
    />
  )
}
