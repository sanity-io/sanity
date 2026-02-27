import {ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Button requires props, only supported by @sanity/ui
import {Button, Menu} from '@sanity/ui'
import {useCallback, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton} from '../../../ui-components'
import {CreateReleaseDialog} from '../../releases/components/dialog/CreateReleaseDialog'
import {useReleasesUpsell} from '../../releases/contexts/upsell/useReleasesUpsell'
import {oversizedButtonStyle} from '../styles'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {ReleasesList} from './ReleasesList'
import {useScrollIndicatorVisibility} from './useScrollIndicatorVisibility'

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 320px;
  /* Remove the default menu gap*/
  > [data-ui='Stack'] {
    gap: 0;
  }
`
const OversizedButton = styled(Button)`
  ${oversizedButtonStyle}
`

export function GlobalPerspectiveMenu({
  selectedPerspectiveName,
  areReleasesEnabled = true,
  menuItemProps,
}: {
  selectedPerspectiveName: string | undefined
  areReleasesEnabled: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): React.JSX.Element {
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const {handleOpenDialog: handleOpenReleasesUpsellDialog, mode: releasesUpsellMode} =
    useReleasesUpsell()
  const styledMenuRef = useRef<HTMLDivElement>(null)

  const {isRangeVisible, onScroll, resetRangeVisibility, setScrollContainer, scrollElementRef} =
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

  return (
    <>
      <MenuButton
        button={
          <OversizedButton
            data-testid="global-perspective-menu-button"
            iconRight={ChevronDownIcon}
            mode="bleed"
            padding={2}
            radius="full"
          />
        }
        id="releases-menu"
        onClose={resetRangeVisibility}
        menu={
          <StyledMenu data-testid="release-menu" ref={styledMenuRef} padding={0}>
            <ReleasesList
              areReleasesEnabled={areReleasesEnabled}
              setScrollContainer={setScrollContainer}
              onScroll={onScroll}
              isRangeVisible={isRangeVisible}
              scrollElementRef={scrollElementRef}
              selectedPerspectiveName={selectedPerspectiveName}
              handleOpenBundleDialog={handleOpenBundleDialog}
              menuItemProps={menuItemProps}
            />
          </StyledMenu>
        }
        popover={{
          constrainSize: true,
          fallbackPlacements: ['bottom-end'],
          placement: 'bottom-end',
          portal: true,
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
