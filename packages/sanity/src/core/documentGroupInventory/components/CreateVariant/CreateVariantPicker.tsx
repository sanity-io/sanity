import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Label, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  useContext,
  useId,
  useState,
} from 'react'
import {CreateVariantFormContext} from 'sanity/_singletons'
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
import {createVariantPickerInsetTrigger, createVariantPickerMenu} from './CreateVariantPicker.css'

export interface CreateVariantPickerOption {
  key: string
  text: string
  icon?: ComponentProps<typeof MenuItem>['icon']
  /** PROPOSED: the glyph in the inset form (a variant's mark is inline there, not row-sized). Falls back to `icon`. */
  formIcon?: ReactNode
  /** PROPOSED: a second line under the text of the option's menu row, in the inset form. */
  subtitle?: string
}

/**
 * PROPOSED: a glyph in the inset form's select, in a trimmed box (1.25rem high, pulled in by 0.375rem each way) so its ink starts at the box
 * edge and lines up with the title above it.
 */
function TrimmedGlyph({children, muted}: {children: ReactNode; muted?: boolean}) {
  const color = muted ? 'var(--card-muted-fg-color)' : undefined
  return (
    <span
      aria-hidden
      style={{
        alignItems: 'center',
        display: 'inline-flex',
        height: '1.25rem',
        marginBlock: '-0.375rem',
        ...(color
          ? ({color, '--icon-color': color, '--card-icon-color': color} as CSSProperties)
          : null),
      }}
    >
      {children}
    </span>
  )
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
  /** PROPOSED: the hint of an empty select, in the inset form. */
  placeholder?: string
  /** PROPOSED: the glyph of an empty select, in the inset form (muted). */
  emptyIcon?: ReactNode
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
  placeholder,
  emptyIcon,
  value,
  onChange,
  disabled,
  testId,
}) => {
  const formStyle = useContext(CreateVariantFormContext)
  const inset = formStyle === 'final'
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
      __unstable_subtitle={inset ? option.subtitle : undefined}
      icon={inset ? (option.formIcon ?? option.icon) : option.icon}
      role="menuitemradio"
      text={option.text}
      pressed={option.key === value?.key}
      onClick={() => onChange(option.key)}
    />
  )

  return (
    <>
      {inset ? (
        // PROPOSED: the title alone, inset by the select's padding so it starts where the select's first glyph starts. No icon, no description.
        <Flex alignItems="center" style={{paddingLeft: 12}}>
          <Text size={1} weight="medium" as="label" htmlFor={id}>
            {label}
          </Text>
        </Flex>
      ) : (
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
      )}
      <div className={inset ? createVariantPickerInsetTrigger : createVariantPickerTrigger}>
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
              {...(inset ? {size: 'large' as const} : null)}
              icon={
                inset ? (
                  <TrimmedGlyph muted={!value}>
                    {value ? ((value.formIcon ?? value.icon) as ReactNode) : emptyIcon}
                  </TrimmedGlyph>
                ) : (
                  value?.icon
                )
              }
              iconRight={ChevronDownIcon}
              text={value?.text ?? (inset ? (placeholder ?? '') : '')}
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
                  aria-label={t('document-group.create-variant.filter-placeholder')}
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
