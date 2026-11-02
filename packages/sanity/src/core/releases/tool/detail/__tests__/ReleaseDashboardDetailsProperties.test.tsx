import {type ReleaseDocument} from '@sanity/client'
import {ClockIcon} from '@sanity/icons/Clock'
import {defineField, type FieldDefinition} from '@sanity/types'
import {act, render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  type ReleasePropertyComponent,
  type ReleasePropertyDescription,
} from '../../../../config/releases/properties'
import {type ReleasePropertiesResolver, type SingleWorkspace} from '../../../../config/types'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {ReleaseDashboardDetails} from '../ReleaseDashboardDetails'
import {type DocumentInRelease} from '../types'
import {documentsInRelease} from './__mocks__/useBundleDocuments.mock'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

const legalReview = defineField({
  name: 'legalReview',
  title: 'Legal review',
  type: 'string',
  options: {
    list: [
      {title: 'Not reviewed', value: 'notReviewed'},
      {title: 'Reviewed', value: 'reviewed'},
    ],
  },
})

const signOff = defineField({
  name: 'signOff',
  title: 'Sign-off',
  type: 'object',
  fields: [
    defineField({name: 'reviewer', title: 'Reviewer', type: 'string'}),
    defineField({name: 'approved', title: 'Approved', type: 'boolean'}),
  ],
})

function withMetadata(metadata: Record<string, unknown>): ReleaseDocument {
  return {
    ...activeASAPRelease,
    metadata: {...activeASAPRelease.metadata, ...metadata} as ReleaseDocument['metadata'],
  }
}

async function renderProperties({
  fields = [],
  properties,
  plugins,
  metadata = {},
  loading = false,
  documents = [documentsInRelease],
}: {
  fields?: FieldDefinition[]
  properties?: ReleasePropertyComponent[] | ReleasePropertiesResolver
  plugins?: SingleWorkspace['plugins']
  metadata?: Record<string, unknown>
  loading?: boolean
  documents?: DocumentInRelease[]
}) {
  const config: Partial<SingleWorkspace> = {
    beta: {variants: {enabled: true}},
    plugins,
    releases: properties
      ? {enabled: true, properties, metadata: {fields}}
      : {enabled: true, metadata: {fields}},
  }
  const wrapper = await createTestProvider({config, resources: [releasesUsEnglishLocaleBundle]})
  const release = withMetadata(metadata)

  const renderElement = (isLoading: boolean) => (
    <ReleaseDashboardDetails
      release={release}
      documents={documents}
      events={[]}
      loading={isLoading}
    />
  )

  let result!: ReturnType<typeof render>
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the studio tree suspends while mounting
  await act(async () => {
    result = render(renderElement(loading), {wrapper})
  })

  return {
    panel: () => screen.getByTestId('release-detail-metadata'),
    finishLoading: () =>
      // oxlint-disable-next-line testing-library/no-unnecessary-act -- see mount above
      act(async () => {
        result.rerender(renderElement(false))
      }),
  }
}

function expectFirstMetadataLabel(label: string) {
  const panel = within(screen.getByTestId('release-detail-metadata'))
  expect(
    panel.getByText('Created').compareDocumentPosition(panel.getByText(label)) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
}

function valueElement(text: string): HTMLElement {
  return within(screen.getByTestId('release-detail-metadata')).getByText(text)
}

describe('ReleaseDashboardDetails release properties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('default rows', () => {
    it('formats each metadata type on one line after the built-in rows', async () => {
      const launchAt = '2026-03-04T15:30:00.000Z'
      const {panel} = await renderProperties({
        fields: [
          legalReview,
          defineField({name: 'notes', title: 'Notes', type: 'text'}),
          defineField({name: 'budget', title: 'Budget', type: 'number'}),
          defineField({name: 'internal', title: 'Internal', type: 'boolean'}),
          defineField({name: 'launchDay', title: 'Launch day', type: 'date'}),
          defineField({name: 'launchAt', title: 'Launch time', type: 'datetime'}),
          defineField({name: 'brief', title: 'Brief', type: 'url'}),
          signOff,
        ],
        metadata: {
          legalReview: 'reviewed',
          notes: 'First line\n\nsecond   line',
          budget: 1234.5,
          internal: true,
          launchDay: '2026-03-04',
          launchAt,
          brief: 'https://example.com/brief',
          signOff: {reviewer: 'Ana Silva', approved: false},
        },
      })

      const expectedDatetime = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(Date.parse(launchAt))

      expect(panel()).toHaveTextContent(
        [
          'Legal reviewReviewed',
          'NotesFirst line second line',
          'Budget1,234.5',
          'InternalYes',
          'Launch dayMar 4, 2026',
          `Launch time${expectedDatetime}`,
          'Briefhttps://example.com/brief',
          'Sign-offReviewer: Ana Silva · Approved: No',
        ].join(''),
      )
      expectFirstMetadataLabel('Legal review')
      expect(
        within(panel()).getByRole('link', {name: 'https://example.com/brief'}),
      ).toHaveAttribute('href', 'https://example.com/brief')
      expect(valueElement('Reviewer: Ana Silva · Approved: No').closest('[title]')).toHaveAttribute(
        'title',
        'Reviewer: Ana Silva · Approved: No',
      )
    })

    it('shows a dash for absent, null, empty and unset object values', async () => {
      const {panel} = await renderProperties({
        fields: [
          legalReview,
          defineField({name: 'notes', title: 'Notes', type: 'text'}),
          defineField({name: 'owner', title: 'Owner', type: 'string'}),
          signOff,
        ],
        metadata: {notes: null, owner: '', signOff: {}},
      })

      expect(panel()).toHaveTextContent('Legal review-Notes-Owner-Sign-off-')
    })

    it('hides a field whose hidden condition is true for the flat metadata document', async () => {
      const hidden = vi.fn(({document}) => document?.category !== 'productLaunch')
      const {panel} = await renderProperties({
        fields: [
          defineField({name: 'category', title: 'Category', type: 'string'}),
          defineField({name: 'launchAt', title: 'Launch date', type: 'datetime', hidden}),
        ],
        metadata: {category: 'campaign', launchAt: '2026-03-04T15:30:00.000Z'},
      })

      expect(within(panel()).queryByText('Launch date')).toBeNull()
      expect(hidden).toHaveBeenCalledWith(
        expect.objectContaining({
          document: {
            _id: 'release.metadata.form',
            _type: 'release.metadata',
            category: 'campaign',
            launchAt: '2026-03-04T15:30:00.000Z',
          },
          value: '2026-03-04T15:30:00.000Z',
        }),
      )
    })

    it('keeps a field whose hidden condition is false', async () => {
      const {panel} = await renderProperties({
        fields: [
          defineField({name: 'category', title: 'Category', type: 'string'}),
          defineField({
            name: 'launchNote',
            title: 'Launch note',
            type: 'string',
            hidden: ({document}) => document?.category !== 'productLaunch',
          }),
        ],
        metadata: {category: 'productLaunch', launchNote: 'Ready'},
      })

      expect(panel()).toHaveTextContent('Launch noteReady')
    })

    it('drops a value whose shape does not match its type and warns once', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const {panel} = await renderProperties({
        fields: [legalReview, defineField({name: 'budget', title: 'Budget', type: 'number'})],
        metadata: {legalReview: 'reviewed', budget: 'lots'},
      })

      expect(within(panel()).queryByText('Budget')).toBeNull()
      expect(panel()).toHaveTextContent('Legal reviewReviewed')
      const budgetWarnings = warn.mock.calls.filter(([message]) =>
        String(message).includes('"budget"'),
      )
      expect(budgetWarnings).toEqual([
        [
          '[releases.properties] No row for metadata field "budget": expected a number value, but received string',
        ],
      ])
    })
  })

  describe('releases.properties', () => {
    it('removes a default row by its field', async () => {
      const {panel} = await renderProperties({
        fields: [legalReview, signOff],
        metadata: {legalReview: 'reviewed'},
        properties: (prev) => prev.filter((row) => row.field !== 'legalReview'),
      })

      expect(within(panel()).queryByText('Legal review')).toBeNull()
      expect(within(panel()).getByText('Sign-off')).toBeInTheDocument()
    })

    it('adds, reorders and hides rows in the order the resolver returns', async () => {
      function GoesLive(): ReleasePropertyDescription {
        return {label: 'Goes live', value: 'In 3 days', icon: ClockIcon, tone: 'caution'}
      }
      function Nothing(): null {
        return null
      }
      const {panel} = await renderProperties({
        fields: [legalReview, signOff],
        metadata: {legalReview: 'reviewed', signOff: {reviewer: 'Ana Silva'}},
        properties: (prev) => [GoesLive, Nothing, ...prev.toReversed()],
      })

      expect(panel()).toHaveTextContent(
        'Goes liveIn 3 daysSign-offReviewer: Ana SilvaLegal reviewReviewed',
      )
      expectFirstMetadataLabel('Goes live')
      expect(valueElement('In 3 days').closest('[data-ui="TextWithTone"]')).toHaveAttribute(
        'data-tone',
        'caution',
      )
    })

    it('passes the release with its metadata and the documents to each row', async () => {
      const documents = [documentsInRelease]
      const Row = vi.fn<ReleasePropertyComponent>(({release, documents: rowDocuments}) => ({
        label: 'Count',
        value: `${String(release.metadata.legalReview)}:${rowDocuments.length}`,
      }))

      const {panel} = await renderProperties({
        fields: [legalReview],
        metadata: {legalReview: 'reviewed'},
        documents,
        properties: [Row],
      })

      expect(panel()).toHaveTextContent('Countreviewed:1')
    })

    it('composes a plugin and the root config', async () => {
      function FromPlugin(): ReleasePropertyDescription {
        return {label: 'From plugin', value: 'plugin'}
      }
      function FromRoot(): ReleasePropertyDescription {
        return {label: 'From root', value: 'root'}
      }
      const {panel} = await renderProperties({
        plugins: [{name: 'plugin', releases: {properties: [FromPlugin]}}],
        properties: (prev) => [FromRoot, ...prev],
      })

      expect(panel()).toHaveTextContent('From rootrootFrom pluginplugin')
    })

    it('ignores unknown description keys with a warning', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      function Extra(): ReleasePropertyDescription {
        return {label: 'Extra', value: 'shown', badge: 'nope'} as ReleasePropertyDescription
      }

      const {panel} = await renderProperties({properties: [Extra]})

      expect(panel()).toHaveTextContent('Extrashown')
      expect(panel()).not.toHaveTextContent('nope')
      expect(warn).toHaveBeenCalledWith(
        '[releases.properties] Extra returned unknown keys, which are ignored: badge',
      )
    })

    it('shows the value tooltip and a link when the row asks for them', async () => {
      function Linked(): ReleasePropertyDescription {
        return {label: 'Brief', value: 'Open brief', href: 'https://example.com', tooltip: 'Brief'}
      }

      await renderProperties({properties: [Linked]})

      const link = screen.getByRole('link', {name: 'Open brief'})
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link.closest('[title]')).toHaveAttribute('title', 'Brief')
    })

    it('shows a fallback value for a row that throws and keeps the other rows', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      function Broken(): ReleasePropertyDescription {
        throw new Error('boom')
      }
      const BrokenField: ReleasePropertyComponent = () => {
        throw new Error('boom')
      }
      BrokenField.field = 'legalReview'

      const {panel} = await renderProperties({
        fields: [legalReview, signOff],
        metadata: {signOff: {reviewer: 'Ana Silva'}},
        properties: (prev) => [Broken, BrokenField, ...prev.slice(1)],
      })

      expect(panel()).toHaveTextContent(
        "PropertyCan't display this valueLegal reviewCan't display this valueSign-offReviewer: Ana Silva",
      )
      expect(screen.getByTestId('release-description-display')).toBeInTheDocument()
    })
  })

  describe('documents', () => {
    it('renders default rows while documents load when no resolver is configured', async () => {
      const {panel} = await renderProperties({
        fields: [legalReview],
        metadata: {legalReview: 'reviewed'},
        loading: true,
      })

      expect(panel()).toHaveTextContent('Legal reviewReviewed')
    })

    it('shows skeletons until documents resolve when a resolver is configured', async () => {
      const Row = vi.fn<ReleasePropertyComponent>(({documents}) => ({
        label: 'Count',
        value: String(documents.length),
      }))

      const {panel, finishLoading} = await renderProperties({
        fields: [legalReview],
        metadata: {legalReview: 'reviewed'},
        loading: true,
        properties: [Row],
      })

      expect(within(panel()).getByText('Legal review')).toBeInTheDocument()
      expect(within(panel()).queryByText('Reviewed')).toBeNull()
      expect(Row).not.toHaveBeenCalled()

      await finishLoading()

      expect(panel()).toHaveTextContent('Legal reviewReviewedCount1')
    })
  })

  describe('collapse toggle', () => {
    function rowsNamed(...labels: string[]): ReleasePropertyComponent[] {
      return labels.map((label) =>
        Object.assign(() => ({label, value: `${label} value`}), {displayName: label}),
      )
    }

    it('is absent with fewer than three metadata rows', async () => {
      await renderProperties({properties: rowsNamed('One', 'Two')})

      expect(screen.queryByTestId('release-properties-toggle')).toBeNull()
    })

    it('collapses only the metadata rows and shows them again', async () => {
      const {panel} = await renderProperties({properties: rowsNamed('One', 'Two', 'Three')})
      const toggle = screen.getByTestId('release-properties-toggle')

      expect(toggle).toHaveTextContent('Show fewer')
      expect(toggle).toHaveAttribute('aria-expanded', 'true')

      await userEvent.click(toggle)

      expect(toggle).toHaveTextContent('Show 3 more')
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(within(panel()).queryByText('One')).toBeNull()
      expect(within(panel()).getByText('Documents')).toBeInTheDocument()
      expect(within(panel()).getByText('Created')).toBeInTheDocument()

      await userEvent.click(toggle)

      expect(panel()).toHaveTextContent('OneOne valueTwoTwo valueThreeThree value')
    })
  })
})
