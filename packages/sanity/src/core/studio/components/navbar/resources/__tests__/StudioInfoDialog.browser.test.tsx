import noop from 'lodash-es/noop.js'
import {PackageVersionInfoContext, type PackageVersionInfoContextValue} from 'sanity/_singletons'
import {SemVer} from 'semver'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {StudioInfoDialog} from '../StudioInfoDialog'

// A released studio that is behind the latest tag, not auto-updating, with a
// finished version check so the spinner stays out of the snapshot.
const OUTDATED_RELEASE: PackageVersionInfoContextValue = {
  checkForUpdates: noop,
  currentVersion: new SemVer('5.0.0'),
  isAutoUpdating: false,
  latestTaggedVersion: new SemVer('5.2.0'),
  versionCheckStatus: {checking: false, lastCheckedAt: new Date('2026-08-21T12:00:00.000Z')},
}

function StudioInfoDialogHarness({value}: {value: PackageVersionInfoContextValue}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <PackageVersionInfoContext.Provider value={value}>
        <StudioInfoDialog onClose={noop} />
      </PackageVersionInfoContext.Provider>
    </TestWrapper>
  )
}

/**
 * Visual coverage for the "About Sanity Studio" dialog: the monogram, the
 * current version badge with its GitHub release link, the latest-version row
 * with the upgrade link, and the OK button.
 */
describe('StudioInfoDialog', () => {
  test('renders the version information for an outdated release', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<StudioInfoDialogHarness value={OUTDATED_RELEASE} />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByRole('heading', {name: 'Sanity Studio'})).toBeVisible()
    // The version tooltip repeats the badge text, so take the visible badge.
    await expect.element(dialog.getByText('v5.0.0', {exact: true}).first()).toBeVisible()
    await expect.element(dialog.getByText('Latest version')).toBeVisible()
    await expect.element(dialog.getByText('v5.2.0', {exact: true}).first()).toBeVisible()
    const okButton = dialog.getByRole('button', {name: 'OK'})
    await expect.element(okButton).toBeVisible()
    // The icon-only GitHub button links to the release of the running version.
    expect(
      document.querySelector('a[href="https://github.com/sanity-io/sanity/releases/tag/v5.0.0"]'),
    ).not.toBeNull()

    // The dialog's focus trap lands on the GitHub button, whose tooltip opens
    // on focus; park focus on the OK button so no tooltip is in the snapshot.
    ;(okButton.element() as HTMLButtonElement).focus()
    await expect.element(okButton).toHaveFocus()

    await settleChromaticEndState()
  })
})
