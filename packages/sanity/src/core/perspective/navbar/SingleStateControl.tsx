import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {type ComponentProps} from 'react'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {isReleaseDocument} from '../../releases/store/types'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {type TargetPerspective} from '../types'

/**
 * PROPOSED (open beta navbar section, `PerspectiveMenuExtension.section.singleControl`): the state control as ONE button, the trigger of the
 * perspective menu. The state icon, the label and the chevron are one target and a click opens the menu at once, the same logic as any other
 * dropdown. The stock control splits them: the icon and the label are a link to the Releases tool, only the chevron opens the menu.
 *
 * @internal
 */
export function SingleStateControl(
  props: {selectedPerspective: TargetPerspective} & Omit<
    ComponentProps<typeof Button>,
    'icon' | 'iconRight' | 'mode' | 'text' | 'tooltipProps'
  >,
): React.JSX.Element {
  // The menu button hands its trigger the click handler, the ref and the aria attributes; they go on to the button.
  const {selectedPerspective, ...buttonProps} = props
  const {t} = useTranslation()
  const label = isPublishedPerspective(selectedPerspective)
    ? t('release.chip.published')
    : isDraftPerspective(selectedPerspective)
      ? t('release.chip.global.drafts')
      : isReleaseDocument(selectedPerspective)
        ? selectedPerspective.metadata?.title || t('release.placeholder-untitled-release')
        : String(selectedPerspective)
  return (
    <Button
      {...buttonProps}
      data-testid="perspective-single-control"
      icon={<ReleaseAvatarIcon release={selectedPerspective} size="small" />}
      iconRight={ChevronDownIcon}
      mode="bleed"
      radius="full"
      style={{maxWidth: 220}}
      text={label}
      tooltipProps={null}
    />
  )
}
