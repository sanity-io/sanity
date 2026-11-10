import {type EditableReleaseDocument} from '@sanity/client'
import {Card} from '@sanity/ui'
import {format} from 'date-fns/format'
import {useState} from 'react'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ReleaseForm} from '../ReleaseForm'

const RELEASE_FORM_STORAGE_KEY = 'studio.release-form.recovery'

const ASAP_RELEASE: EditableReleaseDocument = {
  _id: '_.releases.rNew',
  metadata: {title: '', description: '', releaseType: 'asap'},
}

// A fixed date so the schedule picker renders the same text on every run; picking "At time" in
// the menu would schedule the next hour from `new Date()` instead.
const SCHEDULED_RELEASE: EditableReleaseDocument = {
  _id: '_.releases.rNew',
  metadata: {
    title: 'Spring campaign',
    description: 'Everything for the spring launch.',
    releaseType: 'scheduled',
    intendedPublishAt: '2024-03-15T10:00:00.000Z',
  },
}

/**
 * Chromatic sentinel for the release form shared by the create, copy-to-release and schedule
 * dialogs: the release type menu button, the date picker row for scheduled releases, and the
 * title / description text areas. The form is controlled, so the harness owns the value.
 */
function ReleaseFormHarness({initialValue}: {initialValue: EditableReleaseDocument}) {
  const [value, setValue] = useState(initialValue)
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 560}}>
        <ReleaseForm onChange={setValue} value={value} />
      </Card>
    </TestWrapper>
  )
}

describe('ReleaseForm', () => {
  beforeEach(() => {
    localStorage.removeItem(RELEASE_FORM_STORAGE_KEY)
  })
  afterEach(() => {
    localStorage.removeItem(RELEASE_FORM_STORAGE_KEY)
  })

  it('takes a title for an as-soon-as-possible release and stores it for recovery', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReleaseFormHarness initialValue={ASAP_RELEASE} />)

    await expect.element(page.getByText('As soon as possible')).toBeVisible()
    const title = page.getByTestId('release-form-title')
    await expect.element(title).toHaveAttribute('placeholder', 'Untitled release')

    await userEvent.fill(title, 'Spring campaign')
    await expect.element(title).toHaveValue('Spring campaign')
    await expect
      .poll(() => JSON.parse(localStorage.getItem(RELEASE_FORM_STORAGE_KEY) ?? 'null'))
      .toMatchObject({title: 'Spring campaign', releaseType: 'asap'})

    await settleChromaticEndState()
  })

  it('shows the date picker for a scheduled release', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReleaseFormHarness initialValue={SCHEDULED_RELEASE} />)

    await expect.element(page.getByText('At time')).toBeVisible()
    await expect.element(page.getByTestId('release-form-title')).toHaveValue('Spring campaign')
    await expect
      .element(page.getByTestId('release-form-description'))
      .toHaveValue('Everything for the spring launch.')
    // The picker renders the instant in the browser's time zone, the same one `format` uses here.
    await expect
      .element(page.getByTestId('date-input'))
      .toHaveValue(format(new Date(SCHEDULED_RELEASE.metadata.intendedPublishAt!), 'PP HH:mm'))

    await settleChromaticEndState()
  })

  it('lists the release types in the menu', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReleaseFormHarness initialValue={ASAP_RELEASE} />)

    // The menu button is named by the "Approximate time of release" label pointing at it.
    await userEvent.click(page.getByRole('button', {name: 'Approximate time of release'}))

    const menu = page.getByRole('menu')
    await expect.element(menu).toBeVisible()
    await expect.element(menu.getByRole('menuitem', {name: 'At time'})).toBeVisible()
    await expect.element(menu.getByRole('menuitem', {name: 'Undecided'})).toBeVisible()

    await settleChromaticEndState()
  })
})
