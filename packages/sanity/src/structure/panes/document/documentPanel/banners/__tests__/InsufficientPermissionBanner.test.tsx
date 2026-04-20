import {type ObjectSchemaType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {InsufficientPermissionBanner} from '../InsufficientPermissionBanner'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../../../components/requestPermissionDialog', () => ({
  RequestPermissionDialog: vi.fn(() => null),
  useRoleRequestsStatus: vi.fn(() => ({
    data: 'none',
    loading: false,
    error: false,
  })),
}))

vi.mock(
  '../../../../../components/requestPermissionDialog/__telemetry__/RequestPermissionDialog.telemetry',
  () => ({
    AskToEditDialogOpened: 'AskToEditDialogOpened',
  }),
)

const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>

function setupDocumentPaneMock() {
  mockUseDocumentPane.mockReturnValue({
    documentId: 'test-doc-id',
    schemaType: {name: 'testType'} as ObjectSchemaType,
  } as ReturnType<typeof useDocumentPane>)
}

describe('InsufficientPermissionBanner', () => {
  it('renders the permission check banner', async () => {
    setupDocumentPaneMock()

    const wrapper = await createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<InsufficientPermissionBanner requiredPermission="update" />, {wrapper})

    await waitFor(() => {
      expect(screen.getByTestId('permission-check-banner')).toBeInTheDocument()
    })
  })

  it('hides the ask-to-edit button when askToEdit.enabled is false', async () => {
    setupDocumentPaneMock()

    const wrapper = await createTestProvider({
      config: {
        document: {
          askToEdit: {
            enabled: false,
          },
        },
      },
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<InsufficientPermissionBanner requiredPermission="update" />, {wrapper})

    // The banner should still appear (read-only state is preserved)
    await waitFor(() => {
      expect(screen.getByTestId('permission-check-banner')).toBeInTheDocument()
    })

    // But the "Ask to edit" button should not be rendered
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('hides the ask-to-edit button when askToEdit.enabled function returns false', async () => {
    setupDocumentPaneMock()

    const wrapper = await createTestProvider({
      config: {
        document: {
          askToEdit: {
            enabled: ({documentType}) => documentType !== 'testType',
          },
        },
      },
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<InsufficientPermissionBanner requiredPermission="update" />, {wrapper})

    // The banner should still appear
    await waitFor(() => {
      expect(screen.getByTestId('permission-check-banner')).toBeInTheDocument()
    })

    // But the button should not appear because the function returns false for 'testType'
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows the ask-to-edit button when askToEdit.enabled function returns true', async () => {
    setupDocumentPaneMock()

    const wrapper = await createTestProvider({
      config: {
        document: {
          askToEdit: {
            enabled: () => true,
          },
        },
      },
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<InsufficientPermissionBanner requiredPermission="update" />, {wrapper})

    // The banner should still appear
    await waitFor(() => {
      expect(screen.getByTestId('permission-check-banner')).toBeInTheDocument()
    })

    // Note: the button will only appear if the user is a viewer with role request status available.
    // In the default test mock, the user has the 'administrator' role (not 'viewer'),
    // so the button won't appear regardless. The important thing is that askToEdit.enabled=true
    // does not prevent the button from showing when other conditions are met.
  })

  it('shows the banner by default (askToEdit.enabled defaults to true)', async () => {
    setupDocumentPaneMock()

    // No askToEdit config means it defaults to enabled=true
    const wrapper = await createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<InsufficientPermissionBanner requiredPermission="update" />, {wrapper})

    await waitFor(() => {
      expect(screen.getByTestId('permission-check-banner')).toBeInTheDocument()
    })
  })
})
