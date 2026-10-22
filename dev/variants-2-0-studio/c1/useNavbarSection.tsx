import {type PerspectiveMenuExtension, usePerspective} from 'sanity'

import {CubeIcon} from '../pane/Cube'
import {stateToneOf} from '../pane/stateTone'
import {OpenBetaVariants} from './OpenBetaVariants'

/**
 * The open beta navbar (C1 B, spec N1 to N3): the whole global perspective is ONE grey section. Its base says the state (Drafts yellow, Published
 * green, a release neutral), an outline cube leads it (not a button), then the Variants control, then the stock state control as a white chip. Through
 * the PROPOSED `section` of the perspective menu extension.
 */
export function useNavbarSection(single: boolean): PerspectiveMenuExtension['section'] {
  const {selectedPerspectiveName} = usePerspective()
  const tone = stateToneOf(selectedPerspectiveName)
  return {
    // The cube, then the Variants control, then the state control: "who, then where", as the document pills put Variants first (Faheem,
    // 22 Oct).
    leading: (
      <>
        <span
          data-testid="global-perspective-cube"
          style={{alignItems: 'center', display: 'inline-flex', flex: 'none'}}
          title="Global perspective"
        >
          <CubeIcon size={18} tone={tone} />
        </span>
        <OpenBetaVariants inSection />
      </>
    ),
    singleControl: single,
    // Roomy: the chips sit comfortably inside the base, with the cube a little smaller than the chips.
    style: {background: tone.bg, gap: 8, margin: 0, padding: '6px 6px 6px 14px'},
  }
}
