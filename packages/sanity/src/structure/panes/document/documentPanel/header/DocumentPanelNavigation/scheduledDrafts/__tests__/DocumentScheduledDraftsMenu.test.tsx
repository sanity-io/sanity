import {type ReleaseDocument} from '@sanity/client'
import {render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  useActiveReleases,
  useDocumentVersions,
  usePerspective,
  useScheduledDraftsEnabled,
  type VersionInfoDocumentStub,
} from 'sanity'
import {afterEach, beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {usePaneRouter} from '../../../../../../../components/paneRouter/usePaneRouter'
import {usePerspectiveNavigator} from '../../../../../../../hooks/usePerspectiveNavigator'
import {structureUsEnglishLocaleBundle} from '../../../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../../useDocumentPane'
import {
  createPerspective,
  createRelease,
  createVariant,
  createVersion,
  GROUP_ID,
} from '../../__tests__/fixtures'
import {DocumentScheduledDraftsMenu} from '../DocumentScheduledDraftsMenu'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(),
  useDocumentVersions: vi.fn(),
  usePerspective: vi.fn(),
  useScheduledDraftsEnabled: vi.fn(),
}))

vi.mock('../../../../../useDocumentPane')
vi.mock('../../../../../../../hooks/usePerspectiveNavigator')
vi.mock('../../../../../../../components/paneRouter/usePaneRouter')

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseScheduledDraftsEnabled = useScheduledDraftsEnabled as Mock<
  typeof useScheduledDraftsEnabled
>
const mockUseDocumentPane = useDocumentPane as Mock<() => Partial<DocumentPaneContextValue>>
const mockUsePerspectiveNavigator = usePerspectiveNavigator as Mock<typeof usePerspectiveNavigator>
const mockUsePaneRouter = usePaneRouter as Mock<() => Partial<ReturnType<typeof usePaneRouter>>>

/**
 * A scheduled draft going out on `date`, mid-month at noon so the day is the same everywhere.
 * A paused one stays active with only its intended date, the way pausing leaves it.
 */
function createScheduledDraft(
  releaseId: string,
  date: string,
  options: {paused?: boolean} = {},
): ReleaseDocument {
  const publishAt = `${date}T12:00:00.000Z`
  const scheduledDraft = createRelease(releaseId, '', {
    cardinality: 'one',
    releaseType: 'scheduled',
    intendedPublishAt: publishAt,
  })
  return options.paused ? scheduledDraft : {...scheduledDraft, state: 'scheduled', publishAt}
}

const variantA = createVariant('variantA', 'Variant A')
const decemberDraft = createScheduledDraft('rDecember', '2026-12-15', {paused: true})
const novemberDraft = createScheduledDraft('rNovember', '2026-11-10')
const variantDraft = createScheduledDraft('rVariant', '2026-11-20')
const release = createRelease('rA', 'Release A')

const navigate = vi.fn()
const setParams = vi.fn()
let wrapper: React.ComponentType<{children: React.ReactNode}>

function mockVersions(versions: VersionInfoDocumentStub[]) {
  mockUseDocumentVersions.mockReturnValue({
    data: versions.map((version) => version._id),
    versions,
    loading: false,
  })
}

async function renderMenu() {
  render(
    <>
      <span data-testid="rendered" />
      <DocumentScheduledDraftsMenu />
    </>,
    {wrapper},
  )
  // The locale provider suspends on the first render.
  await screen.findByTestId('rendered')
}

async function openMenu() {
  await userEvent.click(screen.getByTestId('document-scheduled-drafts-menu-button'))
  return screen.findByTestId('document-scheduled-drafts-menu')
}

beforeAll(async () => {
  wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
})

describe('DocumentScheduledDraftsMenu', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue({documentId: GROUP_ID})
    mockUsePerspective.mockReturnValue(createPerspective())
    mockUsePerspectiveNavigator.mockReturnValue({navigate})
    mockUsePaneRouter.mockReturnValue({params: {view: 'form'}, setParams})
    mockUseScheduledDraftsEnabled.mockReturnValue(true)
    const activeReleases = [release, decemberDraft, novemberDraft, variantDraft]
    mockUseActiveReleases.mockReturnValue({
      data: activeReleases,
      byId: new Map(activeReleases.map((activeRelease) => [activeRelease._id, activeRelease])),
      loading: false,
      dispatch: vi.fn(),
    })
    mockVersions([
      createVersion({bundle: 'published'}),
      createVersion({bundle: {release: 'rA'}}),
      createVersion({bundle: {release: 'rDecember'}}),
      createVersion({bundle: {release: 'rNovember'}}),
      createVersion({bundle: {release: 'rVariant'}, variant: 'variantA'}),
    ])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when scheduled drafts are disabled', async () => {
    mockUseScheduledDraftsEnabled.mockReturnValue(false)
    await renderMenu()

    expect(screen.queryByTestId('document-scheduled-drafts-menu-button')).toBeNull()
  })

  it('renders nothing when the selected variant has no scheduled draft', async () => {
    mockVersions([
      createVersion({bundle: 'published'}),
      createVersion({bundle: {release: 'rA'}}),
      createVersion({bundle: {release: 'rVariant'}, variant: 'variantA'}),
    ])
    await renderMenu()

    expect(screen.queryByTestId('document-scheduled-drafts-menu-button')).toBeNull()
  })

  it('lists the scheduled drafts of the document by date, in one "Scheduled for:" section', async () => {
    await renderMenu()

    expect(screen.getByTestId('document-scheduled-drafts-menu-button')).toHaveTextContent(
      'Scheduled drafts',
    )
    const menu = await openMenu()

    const section = within(menu).getByTestId('document-scheduled-drafts-menu-section-scheduled')
    expect(section).toHaveTextContent('Scheduled for:')
    const november = within(section).getByTestId('document-scheduled-draft-rNovember')
    const december = within(section).getByTestId('document-scheduled-draft-rDecember')
    expect(november).toHaveTextContent('Nov 10, 2026')
    expect(december).toHaveTextContent('Dec 15, 2026')
    expect(november.compareDocumentPosition(december)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(within(menu).queryByTestId('document-scheduled-draft-rVariant')).toBeNull()
    expect(within(menu).queryByTestId('document-scheduled-draft-rA')).toBeNull()
  })

  it('follows the selected variant', async () => {
    mockUsePerspective.mockReturnValue(createPerspective({selectedVariants: [variantA]}))
    await renderMenu()

    const menu = await openMenu()

    expect(within(menu).getByTestId('document-scheduled-draft-rVariant')).toBeInTheDocument()
    expect(within(menu).queryByTestId('document-scheduled-draft-rNovember')).toBeNull()
  })

  it('opens a scheduled draft in this pane when it is picked', async () => {
    await renderMenu()

    const menu = await openMenu()
    await userEvent.click(within(menu).getByTestId('document-scheduled-draft-rDecember'))

    expect(navigate).toHaveBeenCalledWith(decemberDraft)
  })

  it('shows the open scheduled draft on the trigger and closes it with the remove control', async () => {
    mockUsePerspective.mockReturnValue(
      createPerspective({
        selectedPerspective: novemberDraft,
        selectedPerspectiveName: 'rNovember',
        selectedReleaseId: 'rNovember',
      }),
    )
    await renderMenu()

    expect(screen.getByTestId('document-scheduled-drafts-menu-button')).toHaveTextContent(
      'Nov 10, 2026',
    )

    await userEvent.click(screen.getByTestId('dropdown-button-clear'))

    // Only the pane param goes. The global perspective is left as it is.
    expect(setParams).toHaveBeenCalledTimes(1)
    expect(setParams).toHaveBeenCalledWith({view: 'form', scheduledDraft: undefined})
  })

  it('marks the paused scheduled drafts with the unlocked icon', async () => {
    await renderMenu()

    const menu = await openMenu()

    const paused = within(menu).getByTestId('document-scheduled-draft-rDecember')
    const scheduled = within(menu).getByTestId('document-scheduled-draft-rNovember')
    expect(paused.querySelector('[data-sanity-icon="unlock"]')).not.toBeNull()
    expect(scheduled.querySelector('[data-sanity-icon="unlock"]')).toBeNull()
  })

  it('shows the unlocked icon instead of the clock on the trigger while a paused scheduled draft is open', async () => {
    mockUsePerspective.mockReturnValue(
      createPerspective({
        selectedPerspective: decemberDraft,
        selectedPerspectiveName: 'rDecember',
        selectedReleaseId: 'rDecember',
      }),
    )
    await renderMenu()

    const trigger = screen.getByTestId('document-scheduled-drafts-menu-button')
    expect(trigger).toHaveTextContent('Dec 15, 2026')
    expect(trigger.querySelector('[data-sanity-icon="unlock"]')).not.toBeNull()
    expect(trigger.querySelector('[data-sanity-icon="clock-small"]')).toBeNull()
    // A selected pill takes its tone on the trigger itself, like a selected version chip
    expect(trigger).toHaveAttribute('data-tone', 'caution')
    expect(trigger).toHaveAttribute('data-selected')
  })

  it('keeps the small clock on the trigger for a scheduled draft that is not paused', async () => {
    mockUsePerspective.mockReturnValue(
      createPerspective({
        selectedPerspective: novemberDraft,
        selectedPerspectiveName: 'rNovember',
        selectedReleaseId: 'rNovember',
      }),
    )
    await renderMenu()

    const trigger = screen.getByTestId('document-scheduled-drafts-menu-button')
    expect(trigger.querySelector('[data-sanity-icon="clock-small"]')).not.toBeNull()
    expect(trigger.querySelector('[data-sanity-icon="unlock"]')).toBeNull()
    // A selected pill takes its tone on the trigger itself, like a selected version chip
    expect(trigger).toHaveAttribute('data-tone', 'suggest')
    expect(trigger).toHaveAttribute('data-selected')
  })

  it('filters the scheduled drafts by date and says when nothing matches', async () => {
    await renderMenu()

    const menu = await openMenu()
    const input = within(menu).getByPlaceholderText('Search scheduled drafts…')

    await userEvent.type(input, 'dec')
    expect(within(menu).getByTestId('document-scheduled-draft-rDecember')).toBeInTheDocument()
    expect(within(menu).queryByTestId('document-scheduled-draft-rNovember')).toBeNull()

    await userEvent.clear(input)
    await userEvent.type(input, 'zzz')
    expect(within(menu).getByTestId('document-scheduled-drafts-menu-no-matches')).toHaveTextContent(
      'Nothing matches "zzz"',
    )
  })
})
