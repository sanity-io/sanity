import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, waitFor} from '@testing-library/react'
import {type ReactNode, StrictMode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {DiagnosticsDialog} from './DiagnosticsDialog'

const mocks = vi.hoisted(() => ({
  gatherStudioDiagnostics: vi.fn(),
}))

vi.mock('@sanity/ui/toast', () => ({useToast: () => ({push: vi.fn()})}))
vi.mock('../../../../../ui-components/dialog/Dialog', () => ({
  Dialog: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))
vi.mock('../../../../hooks/useClient', () => ({useClient: () => ({})}))
vi.mock('../../../diagnostics/gatherStudioDiagnostics', () => ({
  formatStudioDiagnostics: vi.fn(),
  gatherStudioDiagnostics: mocks.gatherStudioDiagnostics,
}))
vi.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [undefined, vi.fn()],
}))
vi.mock('../../../workspace', () => ({
  useWorkspace: () => ({
    basePath: '/',
    currentUser: null,
    dataset: 'production',
    name: 'default',
    projectId: 'project-id',
    schema: {
      get: (name: string) =>
        ({
          article: {
            jsonType: 'object',
            name: 'article',
            type: {jsonType: 'object', name: 'document'},
          },
          categoryLabel: {jsonType: 'string', name: 'categoryLabel'},
          relatedArticles: {jsonType: 'array', name: 'relatedArticles'},
          seo: {jsonType: 'object', name: 'seo'},
        })[name],
      getLocalTypeNames: () => ['article', 'seo', 'categoryLabel', 'relatedArticles'],
    },
    title: 'Default',
  }),
}))
vi.mock('../../../workspaces/useWorkspaces', () => ({
  useWorkspaces: () => [
    {dataset: 'production', projectId: 'project-id'},
    {dataset: 'production', projectId: 'project-id'},
    {dataset: 'staging', projectId: 'other-project'},
  ],
}))
vi.mock('./DiagnosticsReport', () => ({DiagnosticsReport: () => null}))

describe('DiagnosticsDialog', () => {
  beforeEach(() => {
    mocks.gatherStudioDiagnostics.mockReset()
    mocks.gatherStudioDiagnostics.mockReturnValue(new Promise(() => undefined))
  })

  it('starts one diagnostics pass when mounted in Strict Mode', async () => {
    render(
      <StrictMode>
        <ThemeProvider theme={buildTheme()}>
          <DiagnosticsDialog onClose={vi.fn()} />
        </ThemeProvider>
      </StrictMode>,
    )

    await waitFor(() => expect(mocks.gatherStudioDiagnostics).toHaveBeenCalledTimes(1))
    expect(mocks.gatherStudioDiagnostics).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: {documentTypes: 1, objectTypes: 1, primitiveTypes: 1},
        studio: expect.objectContaining({uniqueTargetCount: 2, workspaceCount: 3}),
      }),
    )
  })
})
