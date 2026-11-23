import {SearchIcon} from '@sanity/icons/Search'
import {TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ChangeEvent, useCallback, useState} from 'react'
import {Box, Flex} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {menuOverflowScroller} from '../../../../ui-components/menuButton/menuOverflow.css'
import {useFocusSearchOnOpen} from '../../../../ui-components/menuButton/useFocusSearchOnOpen'
import {useMenuOverflow} from '../../../../ui-components/menuButton/useMenuOverflow'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {CreateReleaseDialog} from '../../../releases/components/dialog/CreateReleaseDialog'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {useReleasesUpsell} from '../../../releases/contexts/upsell/useReleasesUpsell'
import {isReleaseDocument} from '../../../releases/store/types'
import {type ReleasesNavMenuItemPropsGetter} from '../../types'
import {useGetDefaultPerspective} from '../../useGetDefaultPerspective'
import {useSetPerspective} from '../../useSetPerspective'
import {GlobalPerspectiveButton} from '../GlobalPerspectiveButton'
import {MenuSectionDivider} from '../MenuSectionDivider'
import {usePerspectiveDetailLinkTrigger} from '../PerspectiveDetailLink'
import {useStableMenuWidth} from '../useStableMenuWidth'
import {ReleasesList} from './ReleasesList'
import {globalPerspectiveMenu, releasesMenuItemIcon} from './ReleasesMenu.css'
import {useReleasesLabel} from './useReleasesLabel'
import {useScrollIndicatorVisibility} from './useScrollIndicatorVisibility'

/**
 * The labelled chip that opens the releases menu, in every studio.
 */
function ReleasesMenuChip({
  fullWidth,
  ...rest
}: {fullWidth?: boolean} & React.HTMLAttributes<HTMLButtonElement>) {
  const {t} = useTranslation()
  const setPerspective = useSetPerspective()
  const defaultPerspective = useGetDefaultPerspective()
  const {displayTitle, fullTitle, selectedPerspective} = useReleasesLabel()
  // Drafts disabled coerces the default name to `published`, so a truthy name
  // is not enough to tell a selection from the default perspective.
  const canClearPerspective = selectedPerspective !== defaultPerspective
  // The tooltip names what kind of value the chip shows, as the variants chip names its type:
  // a release, or a version of the document (Drafts, Published)
  const pickerLabel = isReleaseDocument(selectedPerspective)
    ? t('release.navbar.chip-label.release')
    : t('release.navbar.chip-label.version')

  const handleClearPerspective = useCallback(() => {
    setPerspective(undefined)
  }, [setPerspective])

  return (
    <GlobalPerspectiveButton
      data-testid="global-perspective-menu-button"
      fullText={fullTitle}
      fullWidth={fullWidth}
      handleClearPerspective={canClearPerspective ? handleClearPerspective : undefined}
      icon={
        <ReleaseAvatarIcon
          release={selectedPerspective}
          size="small"
          className={releasesMenuItemIcon}
        />
      }
      text={displayTitle}
      pickerLabel={pickerLabel}
      {...rest}
    />
  )
}

export function ReleasesMenu({
  fullWidth,
  selectedPerspectiveName,
  areReleasesEnabled = true,
  menuItemProps,
  showDetailLinks = false,
}: {
  /** Stretches the trigger to its parent's width. */
  fullWidth?: boolean
  selectedPerspectiveName: string | undefined
  areReleasesEnabled: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /**
   * Shows a link to each release's page next to it. Only the navbar's global perspective picker
   * does: a picker that chooses a perspective for something else must not navigate away.
   */
  showDetailLinks?: boolean
}): React.JSX.Element {
  const {t} = useTranslation()
  // With releases off the menu lists no releases, so the search doesn't offer to find any.
  const filterPlaceholder = areReleasesEnabled
    ? t('release.navbar.filter-placeholder')
    : t('release.navbar.filter-placeholder-no-releases')
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const {handleOpenDialog: handleOpenReleasesUpsellDialog, mode: releasesUpsellMode} =
    useReleasesUpsell()
  const {menuRef, menuStyle, lockMenuWidth, resetMenuWidth} = useStableMenuWidth()
  const scrollerRef = useMenuOverflow()
  const focusSearchField = useFocusSearchOnOpen()

  const {isRangeVisible, resetRangeVisibility, setScrollContainer, scrollElementRef} =
    useScrollIndicatorVisibility()
  const handleOpenBundleDialog = useCallback(() => {
    if (releasesUpsellMode === 'upsell') {
      handleOpenReleasesUpsellDialog()
      return
    }
    setCreateBundleDialogOpen(true)
  }, [releasesUpsellMode, handleOpenReleasesUpsellDialog])

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.currentTarget.value)
  }, [])

  const handleMenuClose = useCallback(() => {
    resetRangeVisibility()
    resetMenuWidth()
    setFilterQuery('')
  }, [resetMenuWidth, resetRangeVisibility])

  const {triggerRef, handleNavigate: handleNavigateToRelease} = usePerspectiveDetailLinkTrigger()

  return (
    <>
      <MenuButton
        button={<ReleasesMenuChip fullWidth={fullWidth} />}
        id="releases-menu"
        onClose={handleMenuClose}
        onOpen={lockMenuWidth}
        ref={triggerRef}
        menu={
          <Menu
            className={globalPerspectiveMenu}
            data-testid="release-menu"
            ref={menuRef}
            padding={0}
            style={menuStyle}
          >
            {/* 4px below the field, the rule, then the first section's 4px top padding: an 8px gap
            to the first row */}
            <Box flexShrink={0} paddingX={2} paddingTop={2} paddingBottom={1}>
              <TextInput
                aria-label={filterPlaceholder}
                data-testid="global-perspective-filter"
                fontSize={1}
                icon={SearchIcon}
                onChange={handleFilterChange}
                placeholder={filterPlaceholder}
                radius={2}
                ref={focusSearchField}
                value={filterQuery}
              />
              <MenuSectionDivider placement="end" />
            </Box>
            <Flex
              className={menuOverflowScroller}
              flexDirection="column"
              overflowY="auto"
              ref={scrollerRef}
            >
              <ReleasesList
                areReleasesEnabled={areReleasesEnabled}
                filterQuery={filterQuery}
                setScrollContainer={setScrollContainer}
                isRangeVisible={isRangeVisible}
                scrollElementRef={scrollElementRef}
                selectedPerspectiveName={selectedPerspectiveName}
                handleOpenBundleDialog={handleOpenBundleDialog}
                menuItemProps={menuItemProps}
                onNavigateToRelease={showDetailLinks ? handleNavigateToRelease : undefined}
              />
            </Flex>
          </Menu>
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
      {createBundleDialogOpen && (
        <CreateReleaseDialog onCancel={handleClose} onSubmit={handleClose} origin="structure" />
      )}
    </>
  )
}
