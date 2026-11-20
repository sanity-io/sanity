import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Label, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {type ComponentProps, type ComponentType, useId, useState} from 'react'
import {Box, Flex, Icon, type IconProps, Text} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {menuOverflowScroller} from '../../../../ui-components/menuButton/menuOverflow.css'
import {useFocusSearchOnOpen} from '../../../../ui-components/menuButton/useFocusSearchOnOpen'
import {useMenuOverflow} from '../../../../ui-components/menuButton/useMenuOverflow'
import {useStableMenuWidth} from '../../../../ui-components/menuButton/useStableMenuWidth'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {createVariantPickerLabel, createVariantPickerTrigger} from './CreateVariant.css'
import {createVariantPickerMenu} from './CreateVariantPicker.css'

export interface CreateVariantPickerOption {
  key: string
  text: string
  icon?: ComponentProps<typeof MenuItem>['icon']
}

const NO_OPTIONS: CreateVariantPickerOption[] = []

/**
 * The menu does not move the focus to an item when it opens (not even for a keyboard open): the
 * search field takes it, see `useFocusSearchOnOpen`.
 */
const FilterMenu: ComponentType<ComponentProps<typeof Menu>> = (props) => (
  <Menu {...props} shouldFocus={null} />
)

export const CreateVariantPicker: ComponentType<{
  icon: IconProps['icon']
  label: string
  description?: string
  leadingOptions?: CreateVariantPickerOption[]
  /** A heading above `leadingOptions`, shown while they have a match. */
  leadingLabel?: string
  options: CreateVariantPickerOption[]
  /** A heading above `options`, shown while they have a match. */
  optionsLabel?: string
  /** The search field's placeholder; "Search…" when absent. */
  filterPlaceholder?: string
  value: CreateVariantPickerOption | undefined
  onChange: (key: string) => void
  disabled: boolean
  testId: string
}> = ({
  icon,
  label,
  description,
  leadingOptions = NO_OPTIONS,
  leadingLabel,
  options,
  optionsLabel,
  filterPlaceholder,
  value,
  onChange,
  disabled,
  testId,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const id = useId()
  const descriptionId = useId()
  const [filterQuery, setFilterQuery] = useState('')
  const focusSearchField = useFocusSearchOnOpen()
  const {menuRef, menuStyle, lockMenuWidth, resetMenuWidth} = useStableMenuWidth()
  const scrollerRef = useMenuOverflow()

  const query = filterQuery.trim().toLowerCase()

  const matches = (option: CreateVariantPickerOption) =>
    query.length === 0 || option.text.toLowerCase().includes(query)

  const sections = [
    {key: 'leading', label: leadingLabel, options: leadingOptions.filter(matches)},
    {key: 'options', label: optionsLabel, options: options.filter(matches)},
  ].filter((section) => section.options.length > 0)

  const renderOption = (option: CreateVariantPickerOption) => (
    <MenuItem
      key={option.key}
      aria-checked={option.key === value?.key}
      icon={option.icon}
      role="menuitemradio"
      text={option.text}
      pressed={option.key === value?.key}
      onClick={() => onChange(option.key)}
    />
  )

  return (
    <>
      <Flex gap={3} className={createVariantPickerLabel}>
        <Icon icon={icon} size={1} aria-hidden />
        <div>
          <Text size={1} weight="medium" as="label" htmlFor={id}>
            {label}
          </Text>
          {description && (
            <Text size={1} muted as="div" id={descriptionId}>
              {description}
            </Text>
          )}
        </div>
      </Flex>
      <div className={createVariantPickerTrigger}>
        <MenuButton
          id={id}
          onClose={() => {
            resetMenuWidth()
            setFilterQuery('')
          }}
          onOpen={lockMenuWidth}
          button={
            <Button
              data-testid={`${testId}-button`}
              aria-describedby={description ? descriptionId : undefined}
              mode="ghost"
              width="fill"
              justify="flex-start"
              icon={value?.icon}
              iconRight={ChevronDownIcon}
              text={value?.text ?? ''}
              disabled={disabled || leadingOptions.length + options.length === 0}
            />
          }
          menu={
            <FilterMenu
              className={createVariantPickerMenu}
              data-testid={testId}
              padding={1}
              ref={menuRef}
              style={menuStyle}
            >
              <Box flexShrink={0} padding={1}>
                <TextInput
                  aria-label={
                    filterPlaceholder ?? t('document-group.create-variant.filter-placeholder')
                  }
                  ref={focusSearchField}
                  fontSize={1}
                  onChange={(event) => setFilterQuery(event.currentTarget.value)}
                  placeholder={
                    filterPlaceholder ?? t('document-group.create-variant.filter-placeholder')
                  }
                  radius={2}
                  value={filterQuery}
                />
              </Box>
              {sections.length === 0 ? (
                <Box data-testid={`${testId}-no-matches`} paddingX={3} paddingY={3}>
                  <Text muted size={1}>
                    {t('navbar.filter.no-matches', {filter: filterQuery.trim()})}
                  </Text>
                </Box>
              ) : (
                <Flex
                  className={menuOverflowScroller}
                  flexDirection="column"
                  flexGrow={1}
                  flexShrink={1}
                  minHeight="0"
                  overflowY="auto"
                  ref={scrollerRef}
                >
                  <Flex
                    flexDirection="column"
                    flexShrink={0}
                    gap={1}
                    paddingBottom={1}
                    paddingX={1}
                  >
                    {sections.flatMap((section, index) => [
                      ...(index > 0 ? [<MenuDivider key={`${section.key}-divider`} />] : []),
                      ...(section.label
                        ? [
                            <Box
                              key={`${section.key}-label`}
                              paddingX={3}
                              paddingTop={3}
                              paddingBottom={2}
                            >
                              <Label muted size={1} style={{textTransform: 'uppercase'}}>
                                {section.label}
                              </Label>
                            </Box>,
                          ]
                        : []),
                      ...section.options.map(renderOption),
                    ])}
                  </Flex>
                </Flex>
              )}
            </FilterMenu>
          }
          popover={{
            constrainSize: true,
            fallbackPlacements: ['bottom-end'],
            overflow: 'hidden',
            placement: 'bottom-start',
            portal: true,
          }}
        />
      </div>
    </>
  )
}
