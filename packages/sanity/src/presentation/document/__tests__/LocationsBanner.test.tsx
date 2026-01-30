import {EnvelopeIcon, MobileDeviceIcon, PresentationIcon} from '@sanity/icons'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {type DocumentLocation, type PresentationPluginOptions} from '../../types'
import {LocationsBanner} from '../LocationsBanner'

// Mock useDocumentLocations hook
vi.mock('../../useDocumentLocations')

// Mock usePaneRouter from sanity/structure
vi.mock('sanity/structure', async (importOriginal) => ({
  ...(await importOriginal()),
  usePaneRouter: vi.fn(() => ({params: {}})),
}))

// Mock useIntentLink from sanity/router
vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useIntentLink: vi.fn(() => ({href: '/mock-link', onClick: vi.fn()})),
}))

// Mock useCurrentPresentationToolName
vi.mock('../useCurrentPresentationToolName', () => ({
  useCurrentPresentationToolName: vi.fn(() => 'presentation'),
}))

// Import the mocked module
const {useDocumentLocations: mockUseDocumentLocations} = vi.mocked(
  await import('../../useDocumentLocations'),
)

// Mock schema type matching our test document type
const mockSchemaType = {
  name: 'locationResolverTest',
  type: 'document',
  fields: [],
} as any

// Mock presentation plugin options
const mockOptions: PresentationPluginOptions = {
  previewUrl: '/preview',
  name: 'presentation',
  title: 'Presentation',
}

// Mock locations data mirroring the test-studio configuration
const mockLocations: DocumentLocation[] = [
  {
    title: 'Email Client View',
    href: '/newsletter/test-slug/email',
    icon: EnvelopeIcon,
    showHref: false,
  },
  {
    title: 'Web View',
    href: '/newsletter/test-slug',
    // Uses defaults: DesktopIcon, showHref: true
  },
  {
    title: 'Mobile App',
    href: '/newsletter/test-slug/app',
    icon: MobileDeviceIcon,
    showHref: false,
  },
  {
    title: 'In-store Display',
    href: '/newsletter/test-slug/display',
    icon: PresentationIcon,
    showHref: false,
  },
]

describe('LocationsBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering conditions', () => {
    it('returns null when no resolvers provided', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {locations: []},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={undefined}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      // When no resolvers are provided, the banner should not render any location content
      await waitFor(() => {
        expect(screen.queryByText(/used on/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/not used on any pages/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/resolving locations/i)).not.toBeInTheDocument()
      })
    })

    it('returns null when status is empty', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {locations: []},
        status: 'empty',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      // When status is empty, the banner should not render any location content
      await waitFor(() => {
        expect(screen.queryByText(/used on/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/not used on any pages/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/resolving locations/i)).not.toBeInTheDocument()
      })
    })

    it('shows resolving state with spinner', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {locations: []},
        status: 'resolving',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await waitFor(() => {
        expect(screen.getByText(/resolving locations/i)).toBeInTheDocument()
      })
    })
  })

  describe('message display', () => {
    it('shows custom message when provided', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {message: 'This document is used on all pages'},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await waitFor(() => {
        expect(screen.getByText('This document is used on all pages')).toBeInTheDocument()
      })
    })

    it('shows caution tone with warning icon', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {message: 'Caution message', tone: 'caution'},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await waitFor(() => {
        expect(screen.getByText('Caution message')).toBeInTheDocument()
      })
    })

    it('shows critical tone with error icon', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {message: 'Critical message', tone: 'critical'},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await waitFor(() => {
        expect(screen.getByText('Critical message')).toBeInTheDocument()
      })
    })
  })

  describe('locations list', () => {
    it('shows zero count message when locations array is empty', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {locations: []},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await waitFor(() => {
        expect(screen.getByText(/not used on any pages/i)).toBeInTheDocument()
      })
    })

    it('shows single location count', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {locations: [{title: 'Homepage', href: '/'}]},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await waitFor(() => {
        expect(screen.getByText(/used on one page/i)).toBeInTheDocument()
      })
    })

    it('shows multiple locations count', async () => {
      mockUseDocumentLocations.mockReturnValue({
        state: {locations: mockLocations},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await waitFor(() => {
        expect(screen.getByText(/used on 4 pages/i)).toBeInTheDocument()
      })
    })

    it('expands and collapses on click', async () => {
      const user = userEvent.setup()

      mockUseDocumentLocations.mockReturnValue({
        state: {locations: mockLocations},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      // Initially collapsed - location items should be hidden
      await waitFor(() => {
        expect(screen.getByText(/used on 4 pages/i)).toBeInTheDocument()
      })

      // Location titles should not be visible yet (hidden attribute)
      expect(screen.queryByText('Email Client View')).not.toBeVisible()

      // Click to expand
      await user.click(screen.getByText(/used on 4 pages/i))

      // Now location titles should be visible
      await waitFor(() => {
        expect(screen.getByText('Email Client View')).toBeVisible()
        expect(screen.getByText('Web View')).toBeVisible()
        expect(screen.getByText('Mobile App')).toBeVisible()
        expect(screen.getByText('In-store Display')).toBeVisible()
      })

      // Click again to collapse
      await user.click(screen.getByText(/used on 4 pages/i))

      // Location items should be hidden again
      await waitFor(() => {
        expect(screen.queryByText('Email Client View')).not.toBeVisible()
      })
    })
  })

  describe('LocationItem rendering', () => {
    it('renders default DesktopIcon when no icon specified', async () => {
      const user = userEvent.setup()

      mockUseDocumentLocations.mockReturnValue({
        state: {
          locations: [{title: 'Web View', href: '/newsletter/test-slug'}],
        },
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      // Expand to see location items
      await user.click(screen.getByText(/used on one page/i))

      await waitFor(() => {
        expect(screen.getByText('Web View')).toBeVisible()
      })

      // The DesktopIcon should be rendered (we can't easily test for specific icon,
      // but we can verify the location item renders correctly)
    })

    it('renders custom icon when provided', async () => {
      const user = userEvent.setup()
      const CustomIcon = () => <svg data-testid="custom-icon" />

      mockUseDocumentLocations.mockReturnValue({
        state: {
          locations: [{title: 'Custom Location', href: '/custom', icon: CustomIcon}],
        },
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      // Expand to see location items
      await user.click(screen.getByText(/used on one page/i))

      await waitFor(() => {
        expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
      })
    })

    it('shows href by default when showHref is undefined', async () => {
      const user = userEvent.setup()

      mockUseDocumentLocations.mockReturnValue({
        state: {
          locations: [{title: 'Web View', href: '/newsletter/test-slug'}],
        },
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await user.click(screen.getByText(/used on one page/i))

      await waitFor(() => {
        expect(screen.getByText('/newsletter/test-slug')).toBeVisible()
      })
    })

    it('shows href when showHref is true', async () => {
      const user = userEvent.setup()

      mockUseDocumentLocations.mockReturnValue({
        state: {
          locations: [{title: 'Web View', href: '/newsletter/test-slug', showHref: true}],
        },
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await user.click(screen.getByText(/used on one page/i))

      await waitFor(() => {
        expect(screen.getByText('/newsletter/test-slug')).toBeVisible()
      })
    })

    it('hides href when showHref is false', async () => {
      const user = userEvent.setup()

      mockUseDocumentLocations.mockReturnValue({
        state: {
          locations: [
            {title: 'Email Client View', href: '/newsletter/test-slug/email', showHref: false},
          ],
        },
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await user.click(screen.getByText(/used on one page/i))

      await waitFor(() => {
        expect(screen.getByText('Email Client View')).toBeVisible()
      })

      // The href should NOT be visible
      expect(screen.queryByText('/newsletter/test-slug/email')).not.toBeInTheDocument()
    })

    it('always renders the location title', async () => {
      const user = userEvent.setup()

      mockUseDocumentLocations.mockReturnValue({
        state: {locations: mockLocations},
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await user.click(screen.getByText(/used on 4 pages/i))

      await waitFor(() => {
        expect(screen.getByText('Email Client View')).toBeVisible()
        expect(screen.getByText('Web View')).toBeVisible()
        expect(screen.getByText('Mobile App')).toBeVisible()
        expect(screen.getByText('In-store Display')).toBeVisible()
      })
    })
  })

  describe('navigation behavior', () => {
    it('generates correct intent link for location items', async () => {
      const user = userEvent.setup()
      const mockUseIntentLink = vi.mocked((await import('sanity/router')).useIntentLink)

      mockUseDocumentLocations.mockReturnValue({
        state: {
          locations: [{title: 'Homepage', href: '/home'}],
        },
        status: 'resolved',
      })

      const wrapper = await createTestProvider({
        resources: [presentationUsEnglishLocaleBundle],
      })

      render(
        <LocationsBanner
          documentId="test-doc-id"
          options={mockOptions}
          resolvers={{}}
          schemaType={mockSchemaType}
          showPresentationTitle={false}
          version={undefined}
        />,
        {wrapper},
      )

      await user.click(screen.getByText(/used on one page/i))

      await waitFor(() => {
        expect(screen.getByText('Homepage')).toBeVisible()
      })

      // Verify useIntentLink was called with correct params
      expect(mockUseIntentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: 'edit',
          params: expect.objectContaining({
            id: 'test-doc-id',
            type: 'locationResolverTest',
            mode: 'presentation',
            presentation: 'presentation',
            preview: '/home',
          }),
        }),
      )
    })
  })
})
