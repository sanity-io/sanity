import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {
  // oxlint-disable-next-line no-restricted-imports -- the trigger lays out icon + title + description + chevron as custom children, which the studio Button wrapper does not support (same as WorkspaceMenuButton)
  Button as UIButton,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ComponentProps, type ComponentType, useId} from 'react'
import {Box, Flex} from 'ui5'

import {MenuButton, type MenuButtonProps} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'

/**
 * One entry in a condition dropdown: a configured condition key, or one of its values.
 *
 * @internal
 */
export interface ConditionMenuOption {
  value: string
  title: string
  description?: string
  icon?: ComponentType
}

interface ConditionMenuOwnProps {
  onSelect: (value: string) => void
  options: readonly ConditionMenuOption[]
  selected?: ConditionMenuOption
  /**
   * Base test id. The trigger gets `${testId}-menu-button`, the list `${testId}-menu`, and each
   * row `${testId}-option-${value}`.
   */
  testId: string
}

/**
 * `MenuButton` wires the list up by cloning the `menu` element with `onItemClick`, `onEscape`,
 * `aria-labelledby` and friends, so the wrapper must forward the remaining `Menu` props.
 */
type ConditionMenuProps = ConditionMenuOwnProps &
  Omit<ComponentProps<typeof Menu>, 'children' | 'onSelect' | 'selected'>

interface ConditionMenuButtonProps extends ConditionMenuOwnProps {
  disabled?: boolean
  invalid?: boolean
  loading?: boolean
  placeholder: string
}

const NON_BREAKING_SPACE = '\u00A0'

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  fallbackPlacements: ['top-start'],
  matchReferenceWidth: true,
  placement: 'bottom-start',
  tone: 'default',
}

/**
 * The list behind a condition dropdown. Rows follow the workspace switcher: icon, title, and
 * description, with the current choice pressed and checked.
 *
 * @internal
 */
export function ConditionMenu(props: ConditionMenuProps): React.JSX.Element {
  const {onSelect, options, selected, testId, ...menuProps} = props

  return (
    <Menu data-testid={`${testId}-menu`} {...menuProps}>
      {options.map((option) => {
        const isSelected = option.value === selected?.value

        return (
          <MenuItem
            data-testid={`${testId}-option-${option.value}`}
            icon={option.icon}
            iconRight={isSelected ? CheckmarkIcon : undefined}
            key={option.value}
            onClick={isSelected ? undefined : () => onSelect(option.value)}
            pressed={isSelected}
            selected={isSelected}
            text={option.title}
            __unstable_subtitle={option.description}
          />
        )
      })}
    </Menu>
  )
}

/**
 * A select-like dropdown for one half of a condition (the key or its value). The trigger mirrors
 * the menu row it stands for (icon, title, description) and keeps that two-line footprint in every
 * state, so picking never shifts the surrounding form; the options open in a popover the width of
 * the trigger.
 *
 * @internal
 */
export function ConditionMenuButton(props: ConditionMenuButtonProps): React.JSX.Element {
  const {
    disabled = false,
    invalid = false,
    loading = false,
    onSelect,
    options,
    placeholder,
    selected,
    testId,
  } = props
  const id = useId()
  const SelectedIcon = selected?.icon

  return (
    <MenuButton
      button={
        <UIButton
          data-testid={`${testId}-menu-button`}
          disabled={disabled || loading}
          mode="ghost"
          padding={3}
          tone={invalid ? 'critical' : 'default'}
          width="fill"
        >
          <Flex alignItems="flex-start" gap={3}>
            {SelectedIcon ? (
              <Text size={1}>
                <SelectedIcon />
              </Text>
            ) : null}
            <Box flexGrow={1} style={{minWidth: 0}}>
              <Stack gap={1}>
                <Text muted={!selected} size={1} textOverflow="ellipsis" weight="medium">
                  {selected ? selected.title : placeholder}
                </Text>
                {/* The description line is always laid out (blank when there is none) so the
                    trigger is the same height whether or not a choice with a description is made. */}
                <Text muted size={0} textOverflow="ellipsis" weight="medium">
                  {selected?.description ?? NON_BREAKING_SPACE}
                </Text>
              </Stack>
            </Box>
            <Text size={1}>{loading ? <Spinner /> : <ChevronDownIcon />}</Text>
          </Flex>
        </UIButton>
      }
      id={id}
      menu={
        <ConditionMenu onSelect={onSelect} options={options} selected={selected} testId={testId} />
      }
      popover={POPOVER_PROPS}
    />
  )
}
