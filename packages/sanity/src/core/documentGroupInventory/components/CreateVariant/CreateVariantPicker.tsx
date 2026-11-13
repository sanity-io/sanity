import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
// oxlint-disable-next-line no-restricted-imports -- the select is a ghost Button holding its own layout (glyph, value, chevron); Studio's Button only takes text and icons
import {Button as UIButton, Label, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {Box, Flex, Text} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {menuOverflowScroller} from '../../../../ui-components/menuButton/menuOverflow.css'
import {useFocusSearchOnOpen} from '../../../../ui-components/menuButton/useFocusSearchOnOpen'
import {useMenuOverflow} from '../../../../ui-components/menuButton/useMenuOverflow'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {
  createVariantPickerField,
  createVariantPickerGlyph,
  createVariantPickerMenu,
  createVariantPickerMutedGlyph,
  createVariantPickerSelect,
} from './CreateVariantPicker.css'

/**
 * The narrowest a select's menu opens, whatever the select's width: the menu is
 * `max(select width, MIN_MENU_WIDTH)`. A row is 4px of menu padding, 45px before its text, the
 * text, 12px padding and 4px of menu padding; a long variant name such as "Returning Female
 * Visitors under 30" is about 219px at 13px, so the row needs about 284px plus the 2px border.
 * Rounded up to 288.
 *
 * @internal
 */
export const MIN_MENU_WIDTH = 288

export interface CreateVariantPickerOption {
  key: string
  text: string
  /** The glyph of the option's menu row. */
  icon?: ComponentProps<typeof MenuItem>['icon']
  /** The glyph in the select while the option is picked. Falls back to `icon`. */
  selectIcon?: ReactNode
  /** A second, quieter line under the text of the option's menu row. */
  subtitle?: string
}

const NO_OPTIONS: CreateVariantPickerOption[] = []

/**
 * The menu does not move the focus to an item when it opens (not even for a keyboard open): the
 * search field takes it, see `useFocusSearchOnOpen`.
 */
const FilterMenu: ComponentType<ComponentProps<typeof Menu>> = (props) => (
  <Menu {...props} shouldFocus={null} />
)

/**
 * A Sanity icon in a box as wide as the ink it paints, so its left edge is the ink's left edge.
 * Sanity icons draw into a 25-unit box with their own margins; without this the Drafts dot and
 * the documents icon would start further right than the variant mark. The icon keeps its natural
 * size: it is shifted by a negative margin, never shrunk or cropped.
 */
export function TrimmedGlyph({children}: {children: ReactNode}) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const box = ref.current
    const svg = box?.querySelector('svg')
    if (!box || !svg) return
    svg.style.flexShrink = '0'
    svg.style.marginLeft = '0px'
    const origin = svg.getBoundingClientRect().left
    let left = Infinity
    let right = -Infinity
    for (const shape of svg.querySelectorAll('path, circle, rect, ellipse, polygon')) {
      const rect = shape.getBoundingClientRect()
      if (!rect.width) continue
      left = Math.min(left, rect.left)
      right = Math.max(right, rect.right)
    }
    if (right <= left) return
    box.style.width = `${right - left}px`
    svg.style.marginLeft = `${origin - left}px`
  })
  return (
    <span ref={ref} style={TRIMMED_STYLE}>
      {children}
    </span>
  )
}

const TRIMMED_STYLE: CSSProperties = {
  alignItems: 'center',
  display: 'inline-flex',
  flexShrink: 0,
  justifyContent: 'center',
  overflow: 'visible',
}

/**
 * One field of the Create variant form: a title over a full-width select that opens a searchable
 * menu. The select is the size of the Variants tool's "Create variant definition" dialog inputs:
 * 13px text in a 33px box, the glyph on the left and the chevron pinned to the right edge.
 */
export const CreateVariantPicker: ComponentType<{
  label: string
  leadingOptions?: CreateVariantPickerOption[]
  /** A heading above `leadingOptions`, shown while they have a match. */
  leadingLabel?: string
  options: CreateVariantPickerOption[]
  /** A heading above `options`, shown while they have a match. */
  optionsLabel?: string
  /** The search field's placeholder; "Find" when absent. */
  filterPlaceholder?: string
  /** The hint shown, muted, while nothing is picked. */
  placeholder?: string
  /** The glyph shown, muted, while nothing is picked. */
  emptyIcon: ReactNode
  value: CreateVariantPickerOption | undefined
  onChange: (key: string) => void
  disabled: boolean
  testId: string
}> = ({
  label,
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
  const {t} = useTranslation(studioLocaleNamespace)
  const id = useId()
  const titleId = useId()
  const [filterQuery, setFilterQuery] = useState('')
  const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined)
  const focusSearchField = useFocusSearchOnOpen()
  const overflowRef = useMenuOverflow()
  // The list stays mounted while the menu is closed, so it keeps its scroll position. Each open,
  // and each change to the search, starts it at the top again.
  const listElement = useRef<HTMLDivElement | null>(null)
  const scrollListToTop = useCallback(() => {
    if (listElement.current) listElement.current.scrollTop = 0
  }, [])
  const scrollerRef = useCallback(
    (element: HTMLDivElement | null) => {
      listElement.current = element
      const cleanup = overflowRef(element)
      return () => {
        listElement.current = null
        cleanup?.()
      }
    },
    [overflowRef],
  )

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
      __unstable_subtitle={option.subtitle}
      aria-checked={option.key === value?.key}
      icon={option.icon}
      role="menuitemradio"
      text={option.text}
      pressed={option.key === value?.key}
      onClick={() => onChange(option.key)}
    />
  )

  const empty = typeof value === 'undefined'
  const glyph = empty ? emptyIcon : (value.selectIcon ?? (value.icon as ReactNode))

  return (
    <div className={createVariantPickerField} data-testid={`${testId}-field`}>
      {/* A plain title, not a <label>: clicking a label for a button clicks the button, which
          would open the menu from the title. The select takes its name from the title instead. */}
      <Text size={1} weight="medium" id={titleId} data-testid={`${testId}-title`}>
        {label}
      </Text>
      <MenuButton
        id={id}
        onClose={() => setFilterQuery('')}
        onOpen={() => {
          // The menu is as wide as its select, and never narrower than MIN_MENU_WIDTH.
          const trigger = document.getElementById(id)
          setMenuWidth(trigger ? trigger.getBoundingClientRect().width : undefined)
          // A hidden list can't be scrolled, so this waits until the menu is showing.
          requestAnimationFrame(() => {
            scrollListToTop()
            requestAnimationFrame(scrollListToTop)
          })
        }}
        button={
          <UIButton
            aria-labelledby={`${titleId} ${id}`}
            className={createVariantPickerSelect}
            data-testid={`${testId}-button`}
            disabled={disabled || leadingOptions.length + options.length === 0}
            mode="ghost"
            padding={3}
            radius={2}
            title={value?.text}
          >
            <Flex alignItems="center" gap={2} minWidth="0">
              {glyph && (
                <span
                  className={empty ? createVariantPickerMutedGlyph : createVariantPickerGlyph}
                  data-testid={`${testId}-glyph`}
                >
                  {glyph}
                </span>
              )}
              <Box flexGrow={1} minWidth="0">
                <Text
                  data-testid={`${testId}-value`}
                  muted={empty}
                  size={1}
                  truncate={1}
                  weight={empty ? undefined : 'medium'}
                >
                  {value?.text ?? placeholder}
                </Text>
              </Box>
              <span className={createVariantPickerMutedGlyph}>
                <ChevronDownIcon />
              </span>
            </Flex>
          </UIButton>
        }
        menu={
          <FilterMenu
            className={createVariantPickerMenu}
            data-testid={testId}
            padding={1}
            style={{
              minWidth: `min(${MIN_MENU_WIDTH}px, calc(100vw - 24px))`,
              width: menuWidth,
            }}
          >
            <Box flexShrink={0} padding={1}>
              <TextInput
                // Named by the same text it shows, so a field with its own placeholder (the variant
                // search) is not announced as the generic "Find".
                aria-label={
                  filterPlaceholder ?? t('document-group.create-variant.filter-placeholder')
                }
                ref={focusSearchField}
                fontSize={1}
                onChange={(event) => {
                  setFilterQuery(event.currentTarget.value)
                  scrollListToTop()
                }}
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
          // The menu opens from the select's left edge and extends right. If that leaves the
          // viewport, the popover shifts to stay inside it.
          fallbackPlacements: ['top-start'],
          overflow: 'hidden',
          placement: 'bottom-start',
          portal: true,
          preventOverflow: true,
        }}
      />
    </div>
  )
}
