import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
// oxlint-disable-next-line no-restricted-imports -- Button requires props, only supported by @sanity/ui
import {Button} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {useCallback, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton} from '../../../ui-components/menuButton/MenuButton'
import {CreateReleaseDialog} from '../../releases/components/dialog/CreateReleaseDialog'
import {useReleasesUpsell} from '../../releases/contexts/upsell/useReleasesUpsell'
import {oversizedButtonStyle} from '../styles'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {ReleasesList} from './ReleasesList'
import {useScrollIndicatorVisibility} from './useScrollIndicatorVisibility'

const StyledMenu = styled(Menu)`
  /* A fixed width rather than a 200-320px range. The popover is right-aligned
     (placement: bottom-end), so any content-driven width change — a scrollbar
     appearing, a longer release title rendering — moves the menu's left edge,
     which reads as the menu jittering left and right while you move through the
     list. A pinned width cannot move. */
  width: 320px;
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
  trigger,
}: {
  selectedPerspectiveName: string | undefined
  areReleasesEnabled: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /**
   * Overrides the chevron-only trigger. The perspective bar passes a full
   * labelled button so the whole pill is one touch target.
   */
  trigger?: React.ReactElement
}): React.JSX.Element {
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const {handleOpenDialog: handleOpenReleasesUpsellDialog, mode: releasesUpsellMode} =
    useReleasesUpsell()
  const styledMenuRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
      <MenuButton
        button={
          trigger ?? (
            <OversizedButton
              data-testid="global-perspective-menu-button"
              iconRight={ChevronDownIcon}
              mode="bleed"
              padding={2}
              radius="full"
            />
          )
        }
        id="releases-menu"
        onClose={resetRangeVisibility}
        menu={
          <StyledMenu data-testid="release-menu" ref={styledMenuRef} padding={0}>
            <ReleasesList
              areReleasesEnabled={areReleasesEnabled}
              setScrollContainer={setScrollContainer}
              isRangeVisible={isRangeVisible}
              scrollElementRef={scrollElementRef}
              selectedPerspectiveName={selectedPerspectiveName}
              handleOpenBundleDialog={handleOpenBundleDialog}
              menuItemProps={menuItemProps}
            />
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
      {createBundleDialogOpen && (
        <CreateReleaseDialog onCancel={handleClose} onSubmit={handleClose} origin="structure" />
      )}
    </>
  )
}
