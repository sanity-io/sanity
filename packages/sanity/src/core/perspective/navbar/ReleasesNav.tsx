import {CloseIcon} from '@sanity/icons/Close'
import {Card} from '@sanity/ui'
import {type ComponentType} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {usePerspective} from '../../perspective/usePerspective'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {useReleasesToolAvailable} from '../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../studio/workspace'
import {SegmentDivider} from '../../variants/plugin/components/PerspectiveFilter.css'
import {ReleasesToolLink} from '../ReleasesToolLink'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {CurrentGlobalPerspectiveLabel} from './currentGlobalPerspectiveLabel'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'
import {usePerspectiveMenuExtension} from './PerspectiveMenuExtension'
import {SingleStateControl} from './SingleStateControl'

const ReleasesNavContainer = styled(Card)`
  position: relative;
  display: flex;
  &:not([hidden]) {
    display: flex;
  }
  align-items: center;
  gap: 2px;
  padding: 2px;
  margin: -3px 0;

  /* The children in button is rendered inside a span, we need to absolutely position the dot for the error. */
  span:has(> [data-ui='error-status-icon']) {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 0;
  }

  a:hover,
  button:hover {
    position: relative;
    z-index: 2;
  }
`

interface Props {
  withReleasesToolButton?: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  border?: boolean
}

/**
 * @internal
 */
export const ReleasesNav: ComponentType<Props> = ({
  withReleasesToolButton,
  menuItemProps,
  border = true,
}) => {
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const {t} = useTranslation()
  const isDraftModelEnabled = !!useWorkspace().document?.drafts?.enabled
  // PROPOSED: the default perspective is Drafts, or Published where the drafts model is off. Anything else can be cleared back to it.
  const isDefaultPerspective =
    selectedPerspectiveName === undefined ||
    (!isDraftModelEnabled && selectedPerspectiveName === 'published')
  // PROPOSED: a host may add a suffix after the label.
  const extension = usePerspectiveMenuExtension()
  // PROPOSED: a host's section holds the state control and its own controls in one base (no border; the state control is a white chip inside it).
  const section = extension?.section
  // PROPOSED: the stock chip is ONE button that opens the menu (the state icon, the label and the chevron), and a cross that goes back to
  // the default perspective once another is chosen, like the Variants chip next to it. A host that extends the label keeps the split control.
  const chip = (
    <>
      <GlobalPerspectiveMenu
        selectedPerspectiveName={selectedPerspectiveName}
        areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
        menuItemProps={menuItemProps}
        trigger={
          <SingleStateControl
            data-testid="global-perspective-menu-button"
            selectedPerspective={selectedPerspective}
          />
        }
      />
      {!isDefaultPerspective && (
        // The divider runs the chip's full height (through the container's 2px padding), as on the Variants chip.
        <div className={SegmentDivider} style={{margin: '-2px 0'}} />
      )}
      {!isDefaultPerspective && (
        <Button
          aria-label={t('release.navbar.clear', {
            perspective: isDraftModelEnabled
              ? t('release.navbar.drafts')
              : t('release.navbar.published'),
          })}
          data-testid="clear-perspective-button"
          // Compact, as on the Variants chip: a smaller cross with little padding.
          icon={<CloseIcon style={{transform: 'scale(0.65)'}} />}
          mode="bleed"
          onClick={() => setPerspective(undefined)}
          radius="full"
          style={{paddingLeft: 2, paddingRight: 2}}
          tooltipProps={null}
        />
      )}
    </>
  )
  const splitControl = Boolean(extension?.onLabelClick || extension?.labelSuffix)
  const state = !splitControl ? (
    chip
  ) : (
    <>
      {extension?.onLabelClick ? (
        // PROPOSED: the label and suffix become one control (the host toggles something with it).
        // The capture phase keeps a release label's own link from navigating.
        <div
          aria-expanded={extension.labelExpanded}
          data-testid="perspective-label-toggle"
          onClickCapture={(event) => {
            event.preventDefault()
            event.stopPropagation()
            extension.onLabelClick?.()
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            extension.onLabelClick?.()
          }}
          role="button"
          style={{alignItems: 'center', cursor: 'pointer', display: 'flex'}}
          tabIndex={0}
          title={extension.labelTitle}
        >
          <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
          {extension.labelSuffix}
        </div>
      ) : (
        <>
          <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
          {extension?.labelSuffix}
        </>
      )}
      <GlobalPerspectiveMenu
        selectedPerspectiveName={selectedPerspectiveName}
        areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
        menuItemProps={menuItemProps}
      />
    </>
  )
  return (
    <ReleasesNavContainer
      flex="none"
      tone="inherit"
      radius="full"
      data-ui="ReleasesNav"
      border={section ? false : border}
      data-section={section ? '' : undefined}
      style={section?.style}
    >
      {!section && splitControl && withReleasesToolButton && releasesToolAvailable && (
        <ReleasesToolLink />
      )}
      {section ? (
        <>
          {section.leading}
          <div
            data-testid="perspective-section-state"
            style={{
              alignItems: 'center',
              background: 'var(--card-bg-color)',
              borderRadius: 9999,
              display: 'flex',
            }}
          >
            {section.singleControl ? (
              // PROPOSED: one button, the trigger of the menu (no link to the Releases tool inside it).
              <GlobalPerspectiveMenu
                areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
                menuItemProps={menuItemProps}
                selectedPerspectiveName={selectedPerspectiveName}
                trigger={<SingleStateControl selectedPerspective={selectedPerspective} />}
              />
            ) : (
              <>
                {withReleasesToolButton && releasesToolAvailable && <ReleasesToolLink />}
                {state}
              </>
            )}
          </div>
          {section.trailing}
        </>
      ) : (
        state
      )}
    </ReleasesNavContainer>
  )
}
