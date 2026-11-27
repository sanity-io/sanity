import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {Button} from '@sanity/ui'
import {MenuButton} from '@sanity/ui/menu'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../../i18n'
import {OPTION_TRIGGER_PROPS} from '../request/OptionMenu'
import {VISION_MENU_POPOVER, VisionMenu, VisionMenuItem} from '../VisionMenu'

/** A way the result panel can show the result */
export interface ResultViewOption<View extends string> {
  id: View
  label: string
}

export interface ResultViewMenuProps<View extends string> {
  /** Id of the menu button, unique per query tab */
  id: string
  /**
   * Accessible name of the button, naming the shown view. Defaults to the result view's.
   * Another panel that reuses the menu, such as the params view, passes its own.
   */
  buttonLabel?: string
  /** Accessible name of the menu. Defaults to the result view's */
  menuLabel?: string
  /** The views to choose from, in menu order */
  views: readonly ResultViewOption<View>[]
  value: View
  onChange: (view: View) => void
  /** Id of the element showing the result, which the chosen view replaces */
  controls: string
  /** Prefix of the button, menu and item test ids, which differ per panel that has a menu */
  testId?: string
  /** Where the menu opens, under the button's end by default */
  placement?: 'bottom-start' | 'bottom-end'
}

/**
 * The result panel's view selector: a dropdown naming the shown view, listing the others, with
 * the trigger of the Options pickers
 */
export function ResultViewMenu<View extends string>({
  id,
  buttonLabel,
  menuLabel,
  views,
  value,
  onChange,
  controls,
  testId = 'vision-result-view',
  placement = 'bottom-end',
}: ResultViewMenuProps<View>) {
  const {t} = useTranslation(visionLocaleNamespace)
  const active = views.find((view) => view.id === value) ?? views[0]

  return (
    <MenuButton
      button={
        <Button
          {...OPTION_TRIGGER_PROPS}
          aria-controls={controls}
          aria-label={buttonLabel ?? t('vision.result.view.button', {view: active.label})}
          data-testid={`${testId}-button`}
          text={active.label}
        />
      }
      id={id}
      menu={
        <VisionMenu
          aria-label={menuLabel ?? t('vision.result.view.label')}
          data-testid={`${testId}-menu`}
        >
          {views.map((view) => (
            <VisionMenuItem
              aria-checked={view.id === active.id}
              data-testid={`${testId}-${view.id}`}
              iconRight={view.id === active.id ? CheckmarkIcon : undefined}
              key={view.id}
              onClick={() => onChange(view.id)}
              pressed={view.id === active.id}
              role="menuitemradio"
              text={view.label}
            />
          ))}
        </VisionMenu>
      }
      popover={{...VISION_MENU_POPOVER, placement}}
    />
  )
}
