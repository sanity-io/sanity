import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {activeScheduledRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ConfirmScheduledDraftsDialog} from '../ConfirmScheduledDraftsDialog'

const NOOP = () => undefined

const FUTURE_RELEASE = {
  ...activeScheduledRelease,
  metadata: {
    ...activeScheduledRelease.metadata,
    intendedPublishAt: '2099-01-01T00:00:00.000Z',
  },
}

const PAST_RELEASE = {
  ...activeScheduledRelease,
  metadata: {
    ...activeScheduledRelease.metadata,
    intendedPublishAt: '2020-01-01T00:00:00.000Z',
  },
}

export type ConfirmScheduledDraftsDialogStoryMode = 'future' | 'past'

/**
 * Chromatic sentinel for the confirm-active-scheduled-drafts dialog after
 * the ui5 VStack migration. Future dates omit the past-dates warning; a
 * 2020 fixture always shows it. Copy comes from the releases locale bundle
 * (no schedule mutations). Harness for the co-located Storybook CSF file,
 * which waits for the dialog and blurs auto-focus.
 */
export function ConfirmScheduledDraftsDialogStory({
  mode,
}: {
  mode: ConfirmScheduledDraftsDialogStoryMode
}) {
  return (
    <TestWrapper i18nBundles={[releasesUsEnglishLocaleBundle]} schemaTypes={[]}>
      <ConfirmScheduledDraftsDialog
        activeScheduledDrafts={mode === 'past' ? [PAST_RELEASE] : [FUTURE_RELEASE]}
        onClose={NOOP}
      />
    </TestWrapper>
  )
}
