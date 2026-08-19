import {AddIcon} from '@sanity/icons/Add'
import {Text, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {type JSX, useCallback, useMemo, useState} from 'react'
import {useRouter, useStateLink} from 'sanity/router'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspectiveActiveDocument} from '../../../perspective/activeDocument/usePerspectiveActiveDocument'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {CreateVariantDialog} from '../../components/dialog/CreateVariantDialog'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {decodeVariantIdFromRoute, filterVariantsForSearch} from '../../tool/util'
import {isVariantId, type SystemVariant} from '../../types'
import {VARIANTS_TOOL_NAME} from '../index'
import {VariantsMenuSections} from './VariantsMenuSections'
import {suggestIconColor} from './VariantsNav.css'

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
  const [createVariantDialogOpen, setCreateVariantDialogOpen] = useState(false)

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

  const filteredVariants = useMemo(
    () => filterVariantsForSearch(variants, filterQuery),
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

  const handleOpenCreateVariantDialog = useCallback(() => setCreateVariantDialogOpen(true), [])
  const handleCancelCreateVariant = useCallback(() => setCreateVariantDialogOpen(false), [])

  const handleVariantCreated = useCallback(
    (createdVariantId: string) => {
      setCreateVariantDialogOpen(false)
      // Every other item in this menu changes the perspective, so a freshly
      // created variant becomes the selected one rather than leaving the user
      // where they were. Guarded rather than asserted: the dialog reports a bare
      // string and only a well-formed id is a usable perspective.
      if (isVariantId(createdVariantId)) {
        setVariant({variantId: createdVariantId})
      }
    },
    [setVariant],
  )

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
  const DefaultIcon = hasSelectedDocument ? RhombusIcon : RhombusOutlinedIcon

  return (
    <>
      <MenuButton
        button={trigger}
        id="variants-nav-menu"
        onClose={handleMenuClose}
        menu={
          <StyledMenu data-testid="variants-nav-menu" padding={0}>
            <Box padding={2}>
              <TextInput
                data-testid="variant-menu-filter"
                fontSize={1}
                onChange={handleFilterChange}
                placeholder={t('navbar.variant.filter-placeholder')}
                radius={2}
                value={filterQuery}
              />
            </Box>

            <Box paddingX={2} paddingY={1}>
              <MenuItem
                data-testid="variant-default"
                icon={
                  <Text size={2} className={suggestIconColor}>
                    <DefaultIcon />
                  </Text>
                }
                onClick={handleSelectDefault}
                pressed={isDefaultSelected}
                selected={isDefaultSelected}
                text={t('navbar.variant.default')}
              />
            </Box>
            <MenuDivider />

            <VariantsMenuSections
              documentId={activeDocument?.documentId}
              variants={filteredVariants}
              selectedVariantId={selectedVariant?._id}
              onSelect={handleSelectVariant}
            />

            <MenuDivider />
            <Box paddingX={2} paddingY={1}>
              <MenuItem
                as="a"
                data-testid="view-variants-menu-item"
                href={viewVariantsLink.href}
                icon={RhombusOutlinedIcon}
                onClick={viewVariantsLink.onClick}
                text={t('navbar.variant.view-all')}
              />
              <MenuItem
                data-testid="add-variant-menu-item"
                icon={AddIcon}
                onClick={handleOpenCreateVariantDialog}
                text={t('navbar.variant.add')}
              />
            </Box>
          </StyledMenu>
        }
        popover={{
          __unstable_margins: [0, 0, 32, 0],
          constrainSize: true,
          fallbackPlacements: ['bottom-end'],
          placement: 'bottom-end',
          portal: true,
          // @ts-expect-error PopoverProps doesn't include `style`, but the Popover implementation accepts it via React.HTMLProps<HTMLDivElement>
          style: {overflow: 'hidden'} as React.CSSProperties,
          tone: 'default',
          zOffset: 3000,
        }}
      />
      {createVariantDialogOpen && (
        <CreateVariantDialog onCancel={handleCancelCreateVariant} onSubmit={handleVariantCreated} />
      )}
    </>
  )
}
