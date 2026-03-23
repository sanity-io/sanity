import {CropIcon} from '@sanity/icons'
import {Skeleton} from '@sanity/ui'
import {type MouseEventHandler, type ReactNode, type RefObject} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {MenuActionsWrapper} from '../common/MenuActionsWrapper.styled'
import {OptionsMenuPopover} from '../common/OptionsMenuPopover'

export const ImageActionsMenuWaitPlaceholder = () => (
  <MenuActionsWrapper padding={2}>
    <Skeleton style={{width: '25px', height: '25px'}} animated />
  </MenuActionsWrapper>
)

interface ImageActionsMenuProps {
  children: ReactNode
  onEdit: MouseEventHandler<HTMLButtonElement>
  setHotspotButtonElement: (element: HTMLButtonElement | null) => void
  menuButtonRef: RefObject<HTMLButtonElement | null>
  showEdit: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
}

export function ImageActionsMenu(props: ImageActionsMenuProps) {
  const {
    onEdit,
    children,
    showEdit,
    setHotspotButtonElement,
    menuButtonRef,
    onMenuOpen,
    isMenuOpen,
  } = props

  const {t} = useTranslation()

  return (
    <TooltipDelayGroupProvider>
      <MenuActionsWrapper data-buttons space={1} padding={2}>
        {showEdit && (
          <Button
            aria-label={t('inputs.image.actions-menu.edit-details.aria-label')}
            data-testid="options-menu-edit-details"
            icon={CropIcon}
            mode="ghost"
            onClick={onEdit}
            ref={setHotspotButtonElement}
            tooltipProps={{content: t('inputs.image.actions-menu.crop-image-tooltip')}}
          />
        )}
        <OptionsMenuPopover
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals -- it's a translation key, not an attribute string literal
          ariaLabelKey="inputs.image.actions-menu.options.aria-label"
          buttonMode="ghost"
          id="image-actions-menu"
          isMenuOpen={isMenuOpen}
          menuButtonRef={menuButtonRef}
          onMenuOpen={onMenuOpen}
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals -- it's a property, not an attribute string literal
          openOnClick="toggle"
        >
          {children}
        </OptionsMenuPopover>
      </MenuActionsWrapper>
    </TooltipDelayGroupProvider>
  )
}
