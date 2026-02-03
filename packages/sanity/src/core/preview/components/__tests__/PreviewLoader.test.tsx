import {DocumentIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {render} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useValuePreview} from '../../useValuePreview'
import {useVisibility} from '../../useVisibility'
import {PreviewLoader} from '../PreviewLoader'

// Mock dependencies
vi.mock('../../useValuePreview')
vi.mock('../../useVisibility')
vi.mock('../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('../_extractUploadState', () => ({
  _extractUploadState: () => null,
}))

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

    it('should NOT show schema icon when prepare function exists but returns no media', () => {
      // Schema WITH custom prepare function
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

      // Verify the component was called with undefined media (no icon fallback)
      expect(capturedMedia).toBeUndefined()
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

      // media: null is falsy, so the condition !preview?.value?.media is true
      // Since there's a custom prepare, it should return undefined (no fallback)
      expect(capturedMedia).toBeUndefined()
    })

    it('should NOT show schema icon when prepare function returns media: undefined explicitly', () => {
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

      // media: undefined is falsy, so the condition !preview?.value?.media is true
      // Since there's a custom prepare, it should return undefined (no fallback)
      expect(capturedMedia).toBeUndefined()
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
})
