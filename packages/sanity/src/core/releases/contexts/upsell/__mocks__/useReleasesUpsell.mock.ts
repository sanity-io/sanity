import {type Mocked, vi} from 'vitest'

import {type useReleasesUpsell} from '../useReleasesUpsell'

export const useReleasesUpsellMockReturn: Mocked<ReturnType<typeof useReleasesUpsell>> = {
  mode: 'default',
  // @ts-expect-error -- Pre-existing type error, test file recently added to CI type checking
  guardWithReleaseLimitUpsell: vi.fn((cb) => cb()),
  onReleaseLimitReached: vi.fn(),
  upsellDialogOpen: false,
  telemetryLogs: {
    dialogSecondaryClicked: vi.fn(),
    dialogPrimaryClicked: vi.fn(),
    panelViewed: vi.fn(),
    panelDismissed: vi.fn(),
    panelPrimaryClicked: vi.fn(),
    panelSecondaryClicked: vi.fn(),
  },
}
