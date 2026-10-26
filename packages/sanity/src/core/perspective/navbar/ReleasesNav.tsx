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
  // PROPOSED: the chip is one capsule with flush segments, as the Variants chip is: the buttons have no radius or inset of their own, they
  // fill the capsule's height (31px inside the 1px border, 25px in a host's section) and its outline clips their hover fill.
  const flushHeight = section ? 25 : 31
  const flush = {borderRadius: 0, height: flushHeight, minHeight: flushHeight}
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
            style={{...flush, paddingLeft: 10, paddingRight: 4}}
          />
        }
      />
      {!isDefaultPerspective && (
        // The divider runs the chip's full height, as on the Variants chip.
        <div className={SegmentDivider} />
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
          style={{...flush, paddingLeft: 2, paddingRight: 2}}
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
      // The stock chip has no inset: its segments are flush with the outline, which clips them.
      style={
        section?.style ?? (splitControl ? undefined : {gap: 0, overflow: 'hidden', padding: 0})
      }
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
              overflow: section.singleControl ? 'hidden' : undefined,
            }}
          >
            {section.singleControl ? (
              // PROPOSED: one button, the trigger of the menu (no link to the Releases tool inside it), with the cross like the stock chip.
              chip
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
