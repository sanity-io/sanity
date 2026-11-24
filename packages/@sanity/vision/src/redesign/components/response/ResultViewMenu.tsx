import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../../i18n'

/** A way the result panel can show the result */
export interface ResultViewOption<View extends string> {
  id: View
  label: string
}

export interface ResultViewMenuProps<View extends string> {
  /** Id of the menu button, unique per query tab */
  id: string
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

/** The result panel's view selector: a dropdown naming the shown view, listing the others */
export function ResultViewMenu<View extends string>({
  id,
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
          aria-controls={controls}
          aria-label={t('vision.result.view.button', {view: active.label})}
          data-testid={`${testId}-button`}
          fontSize={1}
          gap={2}
          iconRight={ChevronDownIcon}
          mode="bleed"
          padding={2}
          text={active.label}
        />
      }
      id={id}
      menu={
        <Menu aria-label={t('vision.result.view.label')} data-testid={`${testId}-menu`}>
          {views.map((view) => (
            <MenuItem
              aria-checked={view.id === active.id}
              data-testid={`${testId}-${view.id}`}
              fontSize={1}
              iconRight={view.id === active.id ? CheckmarkIcon : undefined}
              key={view.id}
              onClick={() => onChange(view.id)}
              pressed={view.id === active.id}
              role="menuitemradio"
              text={view.label}
            />
          ))}
        </Menu>
      }
      popover={{animate: true, portal: true, placement}}
    />
  )
}
