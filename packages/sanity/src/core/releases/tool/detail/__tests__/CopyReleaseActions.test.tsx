import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type PropsWithChildren} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {CopyReleaseActions} from '../CopyReleaseActions'

const mockLog = vi.fn()
const mockToastPush = vi.fn()
const mockResolvePathFromState = vi.fn().mockReturnValue('/releases/rASAP')
const mockBuildStudioUrl = vi.fn(
  (modifiers: {coreUi?: (url: string) => string; studio?: () => string}) => {
    return modifiers.studio?.() || ''
  },
)
const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined)

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockLog})),
}))

vi.mock('@sanity/ui', () => ({
  useToast: vi.fn(() => ({push: mockToastPush})),
  Menu: ({children}: PropsWithChildren) => <div data-testid="menu">{children}</div>,
}))

vi.mock('../../../../../ui-components', () => ({
  Button: (props: {tooltipProps?: {content: string}}) => (
    <button type="button" data-testid="copy-menu-trigger">
      {props.tooltipProps?.content}
    </button>
  ),
  MenuButton: ({button, menu}: {button: React.ReactElement; menu: React.ReactElement}) => (
    <div>
      {button}
      {menu}
    </div>
  ),
  MenuItem: ({text, onClick}: {text: string; onClick: () => void}) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
}))

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => ({
    resolvePathFromState: mockResolvePathFromState,
  })),
}))

vi.mock('../../../../hooks/useStudioUrl', () => ({
  useStudioUrl: vi.fn(() => ({
    buildStudioUrl: mockBuildStudioUrl,
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

vi.mock('../../../i18n', () => ({
  releasesLocaleNamespace: 'releases',
}))

vi.mock('../../../util/getReleaseIdFromReleaseDocumentId', () => ({
  getReleaseIdFromReleaseDocumentId: vi.fn((id: string) => id.replace('_.releases.', '')),
}))

describe('CopyReleaseActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {writeText: mockClipboardWriteText},
    })
  })

  it('renders the copy menu button and all menu items', () => {
    render(<CopyReleaseActions release={activeASAPRelease} />)

    expect(screen.getByTestId('copy-menu-trigger')).toBeInTheDocument()
    expect(screen.getByText('Copy release link')).toBeInTheDocument()
    expect(screen.getByText('Copy release ID')).toBeInTheDocument()
    expect(screen.getByText('Copy release title')).toBeInTheDocument()
  })

  describe('Copy Release Link', () => {
    it('copies the resolved URL to clipboard, logs telemetry, and toasts', async () => {
      render(<CopyReleaseActions release={activeASAPRelease} />)

      await userEvent.click(screen.getByText('Copy release link'))

      expect(mockResolvePathFromState).toHaveBeenCalledWith({releaseId: 'rASAP'})
      expect(mockBuildStudioUrl).toHaveBeenCalledWith({
        coreUi: expect.any(Function),
        studio: expect.any(Function),
      })
      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        `${window.location.origin}/releases/rASAP`,
      )
      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({name: 'Release Link Copied'}))
      expect(mockToastPush).toHaveBeenCalledWith({
        id: 'copy-release-link',
        status: 'info',
        title: 'Release link copied to clipboard',
      })
    })

    it('constructs the correct URL with the coreUi modifier', async () => {
      mockBuildStudioUrl.mockImplementationOnce((modifiers: {coreUi?: (url: string) => string}) => {
        return modifiers.coreUi?.('https://sanity.io/dashboard/org/app/workspace') || ''
      })

      render(<CopyReleaseActions release={activeASAPRelease} />)

      await userEvent.click(screen.getByText('Copy release link'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        'https://sanity.io/dashboard/org/app/workspace/releases/rASAP',
      )
    })
  })

  describe('Copy Release ID', () => {
    it('copies the release ID to clipboard, logs telemetry, and toasts', async () => {
      render(<CopyReleaseActions release={activeASAPRelease} />)

      await userEvent.click(screen.getByText('Copy release ID'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith('rASAP')
      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({name: 'Release ID Copied'}))
      expect(mockToastPush).toHaveBeenCalledWith({
        id: 'copy-release-id',
        status: 'info',
        title: 'Release ID copied to clipboard',
      })
    })
  })

  describe('Copy Release Title', () => {
    it('copies the release title to clipboard, logs telemetry, and toasts', async () => {
      render(<CopyReleaseActions release={activeASAPRelease} />)

      await userEvent.click(screen.getByText('Copy release title'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith('active asap Release')
      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({name: 'Release Title Copied'}))
      expect(mockToastPush).toHaveBeenCalledWith({
        id: 'copy-release-title',
        status: 'info',
        title: 'Release title copied to clipboard',
      })
    })

    it('copies the fallback title when the release has no title', async () => {
      const releaseWithoutTitle = {
        ...activeASAPRelease,
        metadata: {
          ...activeASAPRelease.metadata,
          title: '',
        },
      }

      render(<CopyReleaseActions release={releaseWithoutTitle} />)

      await userEvent.click(screen.getByText('Copy release title'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith('Untitled')
    })
  })
})
