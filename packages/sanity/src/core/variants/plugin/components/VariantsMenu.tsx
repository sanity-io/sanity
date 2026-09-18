import {Card, Text, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type JSX, useCallback, useMemo, useState} from 'react'
import {useRouter, useStateLink} from 'sanity/router'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspectiveActiveDocument} from '../../../perspective/activeDocument/usePerspectiveActiveDocument'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {decodeVariantIdFromRoute} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {rankVariantsForSearch, VARIANT_FILTER_THRESHOLD} from '../../util/rankVariantsForSearch'
import {VARIANTS_TOOL_NAME} from '../index'
import {VariantsMenuSections} from './VariantsMenuSections'
import {suggestIconColor} from './VariantsNav.css'

// Pinned, as the release menu's filter block is: the input is how you navigate a long list, and a
// filter that scrolls away takes the term with it.
const StickyFilterCard = styled(Card)`
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card-bg-color);
`

const StyledMenu = styled(Menu)`
  min-width: 240px;
  max-width: 320px;

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
  // Filled means "the selected document exists in this variant". A selected
  // document always exists outside any variant, so the default entry fills as
  // soon as there is one.
  const hasSelectedDocument = Boolean(activeDocument)
  const isFiltering = filterQuery.trim().length > 0

  return (
    <>
      <MenuButton
        button={trigger}
        id="variants-nav-menu"
        onClose={handleMenuClose}
        menu={
          <StyledMenu data-testid="variants-nav-menu" padding={0}>
            {/* Gated on the unfiltered count, not the filtered one: keyed off the results, the
                input would disappear underneath whoever was typing into it.

                4px and borderless, matching the release menu and the design's own filter block. */}
            {variants.length >= VARIANT_FILTER_THRESHOLD && (
              <StickyFilterCard borderBottom padding={1}>
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

            {/* Dropped while filtering. A filtered menu is a set of results, and the divider plus
                two navigational rows under it are chrome that competes with them. The release menu
                withholds its action block on the same terms. */}
            {!isFiltering && (
              <>
                {/* The release menu's own action block: a bordered 4px card rather than a
                    divider plus a padded box. It is not sticky here - this menu's actions scroll
                    with the list. */}
                <Card borderTop padding={1}>
                  {/* 8px, against the wrapper's hardcoded 12px: this puts the icon 12px from the
                      panel edge, where every row's icon and every section heading already sits.
                      The design aligns the action icons with the rest of the column (PopoverMenu
                      node 7576:27957). */}
                  <MenuItem
                    as="a"
                    data-testid="view-variants-menu-item"
                    href={viewVariantsLink.href}
                    icon={RhombusOutlinedIcon}
                    onClick={viewVariantsLink.onClick}
                    paddingLeft={2}
                    text={t('navbar.variant.view-all')}
                  />
                </Card>
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
