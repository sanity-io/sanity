import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type PropsWithChildren} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {CopyReleaseActions} from '../CopyReleaseActions'

const mockLog = vi.fn()
const mockResolvePathFromState = vi.fn().mockReturnValue('/releases/rASAP')
const mockBuildIntentUrl = vi.fn((path: string) => `${window.location.origin}${path}`)
const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined)

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockLog})),
}))

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => ({
    resolvePathFromState: mockResolvePathFromState,
  })),
}))

vi.mock('../../../../hooks/useStudioUrl', () => ({
  useStudioUrl: vi.fn(() => ({
    buildIntentUrl: mockBuildIntentUrl,
  })),
}))

vi.mock('../../../../i18n', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'action.copy-release.label': 'Copy',
        'action.copy-release-link.label': 'Copy release link',
        'action.copy-release-id.label': 'Copy release ID',
        'action.copy-release-title.label': 'Copy release title',
        'toast.copy-release-link.success': 'Release link copied to clipboard',
        'toast.copy-release-id.success': 'Release ID copied to clipboard',
        'toast.copy-release-title.success': 'Release title copied to clipboard',
        'release.placeholder-untitled-release': 'Untitled',
      }
      return keys[key] || key
    },
  })),
}))

function TestWrapper({children}: PropsWithChildren) {
  return (
    <ThemeProvider theme={studioTheme}>
      <ToastProvider>
        <LayerProvider>{children}</LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

describe('CopyReleaseActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {writeText: mockClipboardWriteText},
    })
  })

  async function openMenuAndClick(menuItemText: string) {
    await userEvent.click(screen.getByTestId('copy-release-actions-button'))
    await userEvent.click(await screen.findByText(menuItemText))
  }

  it('renders the copy menu button and all menu items', async () => {
    render(<CopyReleaseActions release={activeASAPRelease} />, {wrapper: TestWrapper})

    await userEvent.click(screen.getByTestId('copy-release-actions-button'))

    expect(await screen.findByText('Copy release link')).toBeInTheDocument()
    expect(screen.getByText('Copy release ID')).toBeInTheDocument()
    expect(screen.getByText('Copy release title')).toBeInTheDocument()
  })

  describe('Copy Release Link', () => {
    it('copies the release URL, logs telemetry, and shows a toast', async () => {
      render(<CopyReleaseActions release={activeASAPRelease} />, {wrapper: TestWrapper})
      await openMenuAndClick('Copy release link')

      expect(mockResolvePathFromState).toHaveBeenCalledWith({releaseId: 'rASAP'})
      expect(mockBuildIntentUrl).toHaveBeenCalledWith('/releases/rASAP')
      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        `${window.location.origin}/releases/rASAP`,
      )
      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({name: 'Release Link Copied'}))
      expect(await screen.findByText('Release link copied to clipboard')).toBeInTheDocument()
    })

    it('uses the coreUi base URL when in coreUi mode', async () => {
      mockBuildIntentUrl.mockImplementationOnce(
        (path: string) => `https://sanity.io/dashboard/org/app/workspace${path}`,
      )

      render(<CopyReleaseActions release={activeASAPRelease} />, {wrapper: TestWrapper})
      await openMenuAndClick('Copy release link')

      expect(mockBuildIntentUrl).toHaveBeenCalledWith('/releases/rASAP')
      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        'https://sanity.io/dashboard/org/app/workspace/releases/rASAP',
      )
    })
  })

  describe('Copy Release ID', () => {
    it('copies the release ID, logs telemetry, and shows a toast', async () => {
      render(<CopyReleaseActions release={activeASAPRelease} />, {wrapper: TestWrapper})
      await openMenuAndClick('Copy release ID')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('rASAP')
      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({name: 'Release ID Copied'}))
      expect(await screen.findByText('Release ID copied to clipboard')).toBeInTheDocument()
    })
  })

  describe('Copy Release Title', () => {
    it('copies the release title, logs telemetry, and shows a toast', async () => {
      render(<CopyReleaseActions release={activeASAPRelease} />, {wrapper: TestWrapper})
      await openMenuAndClick('Copy release title')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('active asap Release')
      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({name: 'Release Title Copied'}))
      expect(await screen.findByText('Release title copied to clipboard')).toBeInTheDocument()
    })

    it('falls back to "Untitled" when the release has no title', async () => {
      const releaseWithoutTitle = {
        ...activeASAPRelease,
        metadata: {
          ...activeASAPRelease.metadata,
          title: '',
        },
      }

      render(<CopyReleaseActions release={releaseWithoutTitle} />, {wrapper: TestWrapper})
      await openMenuAndClick('Copy release title')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('Untitled')
    })
  })
})
