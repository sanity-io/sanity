import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
// oxlint-disable-next-line no-restricted-imports -- the inset form's select is a raw ghost Button holding its own layout (glyph, value, chevron), as in the signed-off spec
import {Button as UIButton, Label, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
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
import {createVariantPickerMenu, finalMutedGlyph} from './CreateVariantPicker.css'

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
 * PROPOSED (Storybook "A final", `Trimmed`): a Sanity icon in a box as wide as what it paints, 1.25rem high with a -0.375rem block margin, so it
 * centres on its text line and its left edge is the ink's left edge. Sanity icons draw into a 25-unit box with their own margins, so without this the
 * Drafts dot and the documents icon start about 6px left of the title above them.
 */
function Trimmed({children, muted}: {children: ReactNode; muted?: boolean}) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const box = ref.current
    const svg = box?.querySelector('svg')
    if (!box || !svg) return
    // The icon keeps its natural size: the box is as wide as the ink, the icon is shifted by a negative margin and never cropped or shrunk.
    svg.style.flexShrink = '0'
    svg.style.marginLeft = '0px'
    const origin = svg.getBoundingClientRect().left
    let left = Infinity
    let right = -Infinity
    for (const shape of svg.querySelectorAll('path, circle, rect, ellipse, polygon')) {
      const r = shape.getBoundingClientRect()
      if (!r.width) continue
      left = Math.min(left, r.left)
      right = Math.max(right, r.right)
    }
    if (right <= left) return
    box.style.width = `${right - left}px`
    svg.style.marginLeft = `${origin - left}px`
  })
  return (
    <span
      aria-hidden
      className={muted ? finalMutedGlyph : undefined}
      ref={ref}
      style={{
        alignItems: 'center',
        boxSizing: 'content-box',
        display: 'inline-flex',
        flexShrink: 0,
        height: '1.25rem',
        justifyContent: 'center',
        lineHeight: 0,
        marginBlock: '-0.375rem',
        overflow: 'visible',
      }}
    >
      {children}
    </span>
  )
}

/**
 * PROPOSED (Storybook "A final", `Pick`): the inset form's select. A ghost button, padding 3, radius 2, holding the glyph, the value (or the hint,
 * muted) and the chevron pinned to the right edge; text size 2 throughout, the size of a Studio string field's input.
 */
function FinalSelectTrigger({
  disabled,
  glyph,
  testId,
  text,
  placeholder,
  ...rest
}: {
  disabled: boolean
  glyph: ReactNode
  testId: string
  text: string | undefined
  placeholder: string
}) {
  const empty = text === undefined
  return (
    <UIButton
      {...rest}
      data-testid={testId}
      disabled={disabled}
      mode="ghost"
      padding={0}
      radius={2}
      // The Studio string input's box: 35px high (6px over a 23px text line), 12px in at the sides.
      style={{minWidth: 0, padding: '6px 12px', width: '100%'}}
      title={text}
    >
      <Flex alignItems="center" style={{gap: 8, minWidth: 0}}>
        <span style={{alignItems: 'center', display: 'inline-flex', flexShrink: 0, fontSize: 15}}>
          <Trimmed muted={empty}>{glyph}</Trimmed>
        </span>
        <Box flexGrow={1} style={{minWidth: 0, textAlign: 'left'}}>
          <Text data-testid={`${testId}-value`} muted={empty} size={2} truncate={1}>
            {text ?? placeholder}
          </Text>
        </Box>
        <Text muted size={2}>
          <ChevronDownIcon />
        </Text>
      </Flex>
    </UIButton>
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

  const renderMenuButton = (button: ReactElement) => (
    <MenuButton
      id={id}
      onClose={() => {
        resetMenuWidth()
        setFilterQuery('')
      }}
      onOpen={lockMenuWidth}
      button={button}
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
              <Flex flexDirection="column" flexShrink={0} gap={1} paddingBottom={1} paddingX={1}>
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
  )

  if (inset) {
    // PROPOSED (the signed-off spec, Storybook "A final": FINAL_SPEC and OptionAFinal): a title over a full-width select, 8px apart, the title
    // inset 12px so it starts where the select's first glyph starts. Pixel values, not the space scale, so they are the spec's.
    return (
      <div
        data-testid={`${testId}-field`}
        style={{display: 'flex', flexDirection: 'column', gap: 8}}
      >
        <div style={{alignItems: 'center', display: 'flex', paddingLeft: 12}}>
          <Text size={1} weight="medium" as="label" htmlFor={id}>
            {label}
          </Text>
        </div>
        {renderMenuButton(
          <FinalSelectTrigger
            disabled={disabled || leadingOptions.length + options.length === 0}
            glyph={value ? ((value.formIcon ?? value.icon) as ReactNode) : emptyIcon}
            testId={`${testId}-button`}
            text={value?.text}
            placeholder={placeholder ?? ''}
          />,
        )}
      </div>
    )
  }

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
        {renderMenuButton(
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
          />,
        )}
      </div>
    </>
  )
}
