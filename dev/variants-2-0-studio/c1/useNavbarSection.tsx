import {type PerspectiveMenuExtension, usePerspective} from 'sanity'

import {CubeIcon} from '../pane/Cube'
import {stateToneOf} from '../pane/stateTone'
import {OpenBetaVariants} from './OpenBetaVariants'

/**
 * The open beta navbar (C1 B, spec N1 to N3): the whole global perspective is ONE grey section. Its base says the state (Drafts yellow, Published
 * green, a release neutral), an outline cube leads it (not a button), the stock state control is a white chip, then the Variants control. Through
 * the PROPOSED `section` of the perspective menu extension.
 */
export function useNavbarSection(): PerspectiveMenuExtension['section'] {
  const {selectedPerspectiveName} = usePerspective()
  const tone = stateToneOf(selectedPerspectiveName)
  return {
    leading: (
      <span
        data-testid="global-perspective-cube"
        style={{alignItems: 'center', display: 'inline-flex', flex: 'none'}}
        title="Global perspective"
      >
        <CubeIcon size={22} tone={tone} />
      </span>
    ),
    trailing: <OpenBetaVariants inSection />,
    style: {background: tone.bg, gap: 6, margin: 0, padding: '4px 4px 4px 12px'},
  }
}
