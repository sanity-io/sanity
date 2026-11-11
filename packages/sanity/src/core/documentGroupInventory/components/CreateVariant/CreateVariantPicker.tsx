import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Label, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {
  type ComponentProps,
  type ComponentType,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import {Box, Flex, Icon, type IconProps, Text} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
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

const FilterMenu: ComponentType<
  ComponentProps<typeof Menu> & {filterRef: RefObject<HTMLInputElement | null>}
> = ({filterRef, ...props}) => {
  useEffect(() => {
    filterRef.current?.focus()
  }, [filterRef])

  return <Menu {...props} shouldFocus={null} />
}

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
  const filterRef = useRef<HTMLInputElement>(null)

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
      icon={option.icon}
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
          onClose={() => setFilterQuery('')}
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
              filterRef={filterRef}
              className={createVariantPickerMenu}
              data-testid={testId}
              padding={1}
            >
              <Box flexShrink={0} padding={1}>
                <TextInput
                  ref={filterRef}
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
                  flexDirection="column"
                  flexGrow={1}
                  flexShrink={1}
                  minHeight="0"
                  overflowY="auto"
                  paddingX={1}
                  paddingBottom={1}
                >
                  <Flex flexDirection="column" flexShrink={0} gap={1}>
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
