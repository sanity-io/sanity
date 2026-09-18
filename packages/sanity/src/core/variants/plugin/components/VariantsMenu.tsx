import {DiamondIcon} from '@sanity/icons/Diamond'
import {Card, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type JSX, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useRouter, useStateLink} from 'sanity/router'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspectiveActiveDocument} from '../../../perspective/activeDocument/usePerspectiveActiveDocument'
import {MenuActionsCard} from '../../../perspective/MenuActionsCard'
import {MENU_PINNED_BLOCK_HEIGHT_VAR} from '../../../perspective/styles'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {decodeVariantIdFromRoute} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {rankVariantsForSearch, VARIANT_FILTER_THRESHOLD} from '../../util/rankVariantsForSearch'
import {VARIANTS_TOOL_NAME} from '../index'
import {VariantsMenuSections} from './VariantsMenuSections'

// Pinned, as the release menu's filter block is: the input is how you navigate a long list, and a
// filter that scrolls away takes the term with it.
const StickyFilterCard = styled(Card)`
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card-bg-color);
`

const StyledMenu = styled(Menu)`
  /* Fixed, not a min/max range. The width followed the widest row, so it moved between states: a
     narrower panel at two releases than at twenty-five, and a panel that shrank mid-filter as the
     long titles dropped out of the results. 247px is what the design gives both perspective
     popovers (PopoverMenu nodes 6998:20254 and 7737:50936). Long titles already truncate, so
     nothing needs the panel to grow for them. */
  width: 247px;

  > [data-ui='Stack'] {
    gap: 0;
  }
`

/**
 * @internal
 */
export function VariantsMenu({
  trigger,
}: {
  /**
   * The button that opens the menu. The perspective bar owns it so the whole
   * labelled pill is one touch target, rather than only a chevron.
   */
  trigger: JSX.Element
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const router = useRouter()
  const setVariant = useSetVariant()
  const {data: variants} = useAllVariants()
  const {activeDocument} = usePerspectiveActiveDocument()
  const [filterQuery, setFilterQuery] = useState('')

  const selectedVariantDocumentId = decodeVariantIdFromRoute(
    router.stickyParams.variant ?? undefined,
  )
  const selectedVariant = useMemo(
    () =>
      selectedVariantDocumentId
        ? variants.find((variant) => variant._id === selectedVariantDocumentId)
        : undefined,
    [selectedVariantDocumentId, variants],
  )

  // Ranked, not merely filtered, and on the title alone: `filterVariantsForSearch` also matches
  // ids and condition values, which is right for the variants overview's own search but surfaces
  // rows in this menu whose visible title gives no clue why they appeared.
  const filteredVariants = useMemo(
    () => rankVariantsForSearch(variants, filterQuery),
    [filterQuery, variants],
  )

  const handleSelectDefault = useCallback(() => {
    setVariant({variantId: undefined})
    setFilterQuery('')
  }, [setVariant])

  const handleSelectVariant = useCallback(
    (variant: SystemVariant) => {
      setVariant({variantId: variant._id})
      setFilterQuery('')
    },
    [setVariant],
  )

  const handleFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.currentTarget.value)
  }, [])

  const handleMenuClose = useCallback(() => {
    setFilterQuery('')
  }, [])

  // Links straight at the tool rather than through the `variant` intent. That
  // intent exists to open one specific variant, so with no id there is nothing for
  // the params segment — `useIntentLink` then builds `/intent/variant//`, which
  // decodes without a `params` key and makes `resolveIntentState` throw
  // "intent params must be a string". Mirrors what `ToolLink` does internally,
  // including clearing the tool's own state on the way in.
  const viewVariantsLink = useStateLink({
    state: {tool: VARIANTS_TOOL_NAME, [VARIANTS_TOOL_NAME]: undefined},
  })

  const isDefaultSelected = !selectedVariant
  const isFiltering = filterQuery.trim().length > 0
  // Counted before the search, as the release menu counts its own: narrowing past the threshold
  // would pull the input out from under whoever is typing, and take their term with it.
  const showFilter = variants.length >= VARIANT_FILTER_THRESHOLD

  // Publish the filter block's height so the section headings pin directly below it rather than
  // at the panel's own edge. Without this they resolve `MENU_PINNED_BLOCK_HEIGHT_VAR` to its 0px
  // fallback and pin *underneath* the filter, which sits at the same offset with a higher stacking
  // order and an opaque background - so a heading scrolling up simply disappears. Measured rather
  // than declared for the same reason the release menu measures its own: the input can wrap.
  //
  // A callback ref rather than an effect over `useRef`: the effect would have to name a dependency
  // that changes when the node appears, and nothing here does - the filter's own condition is true
  // from the first render, so the effect ran once against a ref that had not attached yet and was
  // never invited back. This fires when the node attaches, and its cleanup runs when it detaches.
  const observePinnedBlock = useCallback((pinned: HTMLDivElement | null) => {
    if (!pinned) return undefined

    // Walked up from the pinned card rather than taken from a ref on the menu: `Menu` does not
    // forward one to its DOM node. The release menu's root is a `Card`, which does, so it needs
    // no walk.
    const root = pinned.closest<HTMLElement>('[data-ui="Menu"]')
    if (!root) return undefined

    const publish = () =>
      root.style.setProperty(MENU_PINNED_BLOCK_HEIGHT_VAR, `${pinned.offsetHeight}px`)

    publish()

    // The block changes height in use: the input can wrap.
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(publish)
    observer.observe(pinned)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <MenuButton
        button={trigger}
        id="variants-nav-menu"
        onClose={handleMenuClose}
        menu={
          <StyledMenu data-testid="variants-nav-menu" padding={0}>
            {/* 4px and borderless, matching the release menu and the design's own filter block. */}
            {showFilter && (
              <StickyFilterCard borderBottom padding={1} ref={observePinnedBlock}>
                <TextInput
                  border={false}
                  data-testid="variant-menu-filter"
                  fontSize={1}
                  onChange={handleFilterChange}
                  placeholder={t('navbar.variant.filter-placeholder')}
                  radius={2}
                  value={filterQuery}
                />
              </StickyFilterCard>
            )}

            <VariantsMenuSections
              documentId={activeDocument?.documentId}
              variants={filteredVariants}
              selectedVariantId={selectedVariant?._id}
              onSelect={handleSelectVariant}
              searchTerm={filterQuery}
              isDefaultSelected={isDefaultSelected}
              onSelectDefault={handleSelectDefault}
            />

            {/* Dropped while filtering, as the release menu's is: a filtered menu is a set of
                results, and a navigational row under them is chrome that competes. */}
            {!isFiltering && (
              <>
                {/* The release menu's own action block: a bordered 4px card rather than a
                    divider plus a padded box. It is not sticky here - this menu's actions scroll
                    with the list. */}
                <MenuActionsCard borderTop padding={1} data-testid="variant-menu-actions">
                  {/* The icon goes in plain, at the shared MenuItem's own size. An earlier pass
                      scaled it to a 33px box to match the list rows' diamonds; that moved the ink
                      out of column in one direction and the text in the other. Built like the
                      release menu's rows, the box lands where theirs does. */}
                  <MenuItem
                    as="a"
                    data-testid="view-variants-menu-item"
                    href={viewVariantsLink.href}
                    icon={DiamondIcon}
                    onClick={viewVariantsLink.onClick}
                    text={t('navbar.variant.view-all')}
                  />
                </MenuActionsCard>
              </>
            )}
          </StyledMenu>
        }
        popover={{
          __unstable_margins: [0, 0, 32, 0],
          constrainSize: true,
          // Left-aligned with the trigger: the panel's left edge meets the
          // button's, so the menu items line up under the button's own icon.
          // `bottom-end` stays as the fallback so a panel that would overflow the
          // viewport flips horizontally rather than vertically.
          fallbackPlacements: ['bottom-end'],
          placement: 'bottom-start',
          portal: true,
          // @ts-expect-error PopoverProps doesn't include `style`, but the Popover implementation accepts it via React.HTMLProps<HTMLDivElement>
          style: {overflow: 'hidden'} as React.CSSProperties,
          tone: 'default',
          zOffset: 3000,
        }}
      />
    </>
  )
}
