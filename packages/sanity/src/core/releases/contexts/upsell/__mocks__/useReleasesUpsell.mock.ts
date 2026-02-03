import {type useReleasesUpsell} from '../useReleasesUpsell'
import {type Mocked, vi} from 'vitest'

export const useReleasesUpsellMockReturn: Mocked<ReturnType<typeof useReleasesUpsell>> = {
  mode: 'default',
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
