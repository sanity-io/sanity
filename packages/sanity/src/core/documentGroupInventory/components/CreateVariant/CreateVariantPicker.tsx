import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {TextInput} from '@sanity/ui'
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
  options: CreateVariantPickerOption[]
  value: CreateVariantPickerOption | undefined
  onChange: (key: string) => void
  disabled: boolean
  testId: string
}> = ({
  icon,
  label,
  description,
  leadingOptions = NO_OPTIONS,
  options,
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

  const sections = [leadingOptions.filter(matches), options.filter(matches)].filter(
    (section) => section.length > 0,
  )

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
                  aria-label={t('document-group.create-variant.filter-placeholder')}
                  fontSize={1}
                  onChange={(event) => setFilterQuery(event.currentTarget.value)}
                  placeholder={t('document-group.create-variant.filter-placeholder')}
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
                      ...(index > 0 ? [<MenuDivider key="divider" />] : []),
                      ...section.map(renderOption),
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
