import {DocumentIcon} from '@sanity/icons/Document'
import {type SchemaType} from '@sanity/types'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {type ComponentType, lazy} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type PreviewProps} from '../../../components/previews/types'
import {useValuePreview} from '../../useValuePreview'
import {useVisibility} from '../../useVisibility'
import {PreviewLoader} from '../PreviewLoader'

// Mock dependencies
vi.mock('../../useValuePreview')
vi.mock('../../useVisibility')
// The lazy-component fallback renders `SanityDefaultPreview`, which builds an image URL builder
// from the studio client; neither is exercised with icon media.
vi.mock('../../../hooks/useClient', () => ({useClient: () => ({})}))
vi.mock('@sanity/image-url', () => ({createImageUrlBuilder: () => ({})}))
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal()),
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('../_extractUploadState', () => ({
  _extractUploadState: () => null,
}))

const theme = buildTheme()

// Mock component that captures the media prop for testing
let capturedMedia: unknown
const MockPreviewComponent = vi.fn((props: {media?: unknown}) => {
  capturedMedia = props.media
  return null
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useVisibility).mockReturnValue(true)
  capturedMedia = undefined
})

describe('PreviewLoader', () => {
  describe('media fallback behavior (issue #1200)', () => {
    it('should show schema icon when no prepare function and no media returned', () => {
      // Schema without custom prepare function
      const schemaType = {
        name: 'testDoc',
        icon: DocumentIcon,
        preview: {
          select: {title: 'title'},
          // No prepare function
        },
      } as unknown as SchemaType

      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: 'Test Title'}, // No media in return value
      })

      render(
        <PreviewLoader
          component={MockPreviewComponent}
          schemaType={schemaType}
          value={{_id: 'test', _type: 'testDoc'}}
          skipVisibilityCheck
        />,
      )

      // Verify the component was called with the schema icon as media
      expect(capturedMedia).toBe(DocumentIcon)
    })

    it('should show schema icon when prepare function exists but returns no media key', () => {
      // Schema WITH custom prepare function that omits media key entirely
      const schemaType = {
        name: 'testDoc',
        icon: DocumentIcon,
        preview: {
          select: {title: 'title'},
          prepare: ({title}: {title: string}) => ({title}), // Custom prepare that omits media
        },
      } as unknown as SchemaType

      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: 'Test Title'}, // No media key in return value
      })

      render(
        <PreviewLoader
          component={MockPreviewComponent}
          schemaType={schemaType}
          value={{_id: 'test', _type: 'testDoc'}}
          skipVisibilityCheck
        />,
      )

      // media key is absent, so fall back to schema icon
      expect(capturedMedia).toBe(DocumentIcon)
    })

    it('should show returned media when prepare function returns media', () => {
      const CustomMediaComponent = () => <span>Custom Media</span>

      // Schema WITH custom prepare function that returns media
      const schemaType = {
        name: 'testDoc',
        icon: DocumentIcon,
        preview: {
          select: {title: 'title'},
          prepare: ({title}: {title: string}) => ({title, media: CustomMediaComponent}),
        },
      } as unknown as SchemaType

      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: 'Test Title', media: CustomMediaComponent},
      })

      render(
        <PreviewLoader
          component={MockPreviewComponent}
          schemaType={schemaType}
          value={{_id: 'test', _type: 'testDoc'}}
          skipVisibilityCheck
        />,
      )

      // Verify the component was called with the returned media
      expect(capturedMedia).toBe(CustomMediaComponent)
    })

    it('should NOT show schema icon when prepare function returns media: null', () => {
      // Schema WITH custom prepare function that explicitly returns null media
      const schemaType = {
        name: 'testDoc',
        icon: DocumentIcon,
        preview: {
          select: {title: 'title'},
          prepare: ({title}: {title: string}) => ({title, media: null}),
        },
      } as unknown as SchemaType

      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: 'Test Title', media: null},
      })

      render(
        <PreviewLoader
          component={MockPreviewComponent}
          schemaType={schemaType}
          value={{_id: 'test', _type: 'testDoc'}}
          skipVisibilityCheck
        />,
      )

      // media key is present and falsy (null), so no icon is shown
      expect(capturedMedia).toBeUndefined()
    })

    it('should NOT show schema icon when prepare function returns media: false', () => {
      const schemaType = {
        name: 'testDoc',
        icon: DocumentIcon,
        preview: {
          select: {title: 'title'},
          prepare: ({title}: {title: string}) => ({title, media: false}),
        },
      } as unknown as SchemaType

      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: 'Test Title', media: false},
      })

      render(
        <PreviewLoader
          component={MockPreviewComponent}
          schemaType={schemaType}
          value={{_id: 'test', _type: 'testDoc'}}
          skipVisibilityCheck
        />,
      )

      // media: false is an explicit opt-out, no icon shown
      expect(capturedMedia).toBeUndefined()
    })

    it('should show schema icon when prepare function returns media: undefined', () => {
      // Schema WITH custom prepare function that explicitly returns undefined media
      const schemaType = {
        name: 'testDoc',
        icon: DocumentIcon,
        preview: {
          select: {title: 'title'},
          prepare: ({title}: {title: string}) => ({title, media: undefined}),
        },
      } as unknown as SchemaType

      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: 'Test Title', media: undefined},
      })

      render(
        <PreviewLoader
          component={MockPreviewComponent}
          schemaType={schemaType}
          value={{_id: 'test', _type: 'testDoc'}}
          skipVisibilityCheck
        />,
      )

      // media: undefined is not an explicit opt-out, fall back to schema icon
      expect(capturedMedia).toBe(DocumentIcon)
    })

    it('should show schema icon when no preview config at all', () => {
      // Schema without any preview config
      const schemaType = {
        name: 'testDoc',
        icon: DocumentIcon,
        // No preview config at all
      } as unknown as SchemaType

      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: 'Test Title'},
      })

      render(
        <PreviewLoader
          component={MockPreviewComponent}
          schemaType={schemaType}
          value={{_id: 'test', _type: 'testDoc'}}
          skipVisibilityCheck
        />,
      )

      // No preview config means no prepare function, so fallback to schema icon
      expect(capturedMedia).toBe(DocumentIcon)
    })
  })

  describe('lazy preview component', () => {
    type LoadedPreview = ComponentType<Omit<PreviewProps, 'renderDefault'>>

    function renderLazyPreview(schemaType: SchemaType) {
      let resolveComponent!: (component: LoadedPreview) => void
      const LazyPreview = lazy(
        () =>
          new Promise<{default: LoadedPreview}>((resolve) => {
            resolveComponent = (component) => resolve({default: component})
          }),
      )

      // oxlint-disable-next-line testing-library/no-unnecessary-act -- the lazy preview suspends during mount, and React only resumes work that suspended inside an awaited async `act`
      const mounted = act(async () => {
        render(
          <ThemeProvider theme={theme}>
            <PreviewLoader
              component={LazyPreview}
              schemaType={schemaType}
              status={<span data-testid="preview-status" />}
              value={{_id: 'test', _type: 'testDoc'}}
              skipVisibilityCheck
            />
          </ThemeProvider>,
        )
      })
      return {mounted, resolve: (component: LoadedPreview) => resolveComponent(component)}
    }

    it('shows the default preview placeholder until the component loads', async () => {
      const schemaType = {name: 'testDoc', icon: DocumentIcon} as unknown as SchemaType
      vi.mocked(useValuePreview).mockReturnValue({isLoading: false, value: {title: 'Test Title'}})

      const {mounted, resolve} = renderLazyPreview(schemaType)
      await mounted

      const placeholder = screen.getByTestId('default-preview')
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
      // Layout props reach the placeholder too, so its footprint matches the loaded preview.
      expect(screen.getByTestId('preview-status')).toBeInTheDocument()
      // The loaded preview shows the type icon on the left and one text row, so the placeholder
      // reserves the media slot and draws a single row.
      expect(placeholder.querySelectorAll('[data-ui="Skeleton"]')).toHaveLength(1)
      expect(placeholder.querySelectorAll('[data-ui="TextSkeleton"]')).toHaveLength(1)

      await act(async () => {
        resolve((props) => (
          <div data-testid="loaded-preview">
            {typeof props.title === 'string' ? props.title : null}
          </div>
        ))
      })

      expect(screen.getByTestId('loaded-preview')).toHaveTextContent('Test Title')
      expect(screen.queryByTestId('default-preview')).not.toBeInTheDocument()
    })

    it('draws one row for a resolved value without a title, like the loaded title fallback', async () => {
      const schemaType = {name: 'testDoc', icon: DocumentIcon} as unknown as SchemaType
      // `useValuePreview` settled, but the document has nothing to show for a title or subtitle.
      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: undefined, subtitle: undefined},
      })

      const {mounted} = renderLazyPreview(schemaType)
      await mounted

      const placeholder = screen.getByTestId('default-preview')
      expect(placeholder.querySelectorAll('[data-ui="TextSkeleton"]')).toHaveLength(1)
    })

    it('draws both rows while the value itself is still loading', async () => {
      const schemaType = {name: 'testDoc', icon: DocumentIcon} as unknown as SchemaType
      vi.mocked(useValuePreview).mockReturnValue({isLoading: true, value: undefined})

      const {mounted} = renderLazyPreview(schemaType)
      await mounted

      const placeholder = screen.getByTestId('default-preview')
      expect(placeholder.querySelectorAll('[data-ui="TextSkeleton"]')).toHaveLength(2)
    })

    it('reserves the media slot when the type has no icon, like the loaded fallback icon does', async () => {
      const schemaType = {name: 'testDoc'} as unknown as SchemaType
      vi.mocked(useValuePreview).mockReturnValue({
        isLoading: false,
        value: {title: 'Test Title', subtitle: 'Second row'},
      })

      const {mounted} = renderLazyPreview(schemaType)
      await mounted

      const placeholder = screen.getByTestId('default-preview')
      expect(placeholder.querySelectorAll('[data-ui="Skeleton"]')).toHaveLength(1)
      // A value with a subtitle gets both rows.
      expect(placeholder.querySelectorAll('[data-ui="TextSkeleton"]')).toHaveLength(2)
    })
  })
})
