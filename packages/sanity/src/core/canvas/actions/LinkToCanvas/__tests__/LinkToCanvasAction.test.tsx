import {renderHook, waitFor} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {beforeAll, beforeEach, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentActionProps} from '../../../../config/document/actions'
import {canvasUsEnglishLocaleBundle} from '../../../i18n'

// The gate tests swap this mocked return value between the two tests.
const navigateMock = vi.hoisted(() => ({canLink: false}))

vi.mock('../../../useCanvasNavigate', () => ({
  useCanvasNavigate: () => ({
    isAvailable: true,
    canLink: navigateMock.canLink,
    openCanvas: vi.fn(),
  }),
}))
vi.mock('../../../../store/renderingContext/useRenderingContext', () => ({
  useRenderingContext: () => ({name: 'coreUi'}),
}))
vi.mock('../../useCanvasCompanionDoc', () => ({
  useCanvasCompanionDoc: () => ({isLinked: false, loading: false, isLockedByCanvas: false}),
}))
vi.mock('../../../useCanvasTelemetry', () => ({
  useCanvasTelemetry: () => ({linkCtaClicked: vi.fn()}),
}))
vi.mock('../../../../form/contexts/GetFormValue', () => ({
  useGetFormValue: () => () => ({_id: 'doc-1'}),
}))
vi.mock('../../../../store/project/useProjectOrganizationId', () => ({
  useProjectOrganizationId: () => ({value: 'org-1', isLoading: false}),
}))

const {useLinkToCanvasAction} = await import('../LinkToCanvasAction')

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider({resources: [canvasUsEnglishLocaleBundle]})
})

beforeEach(() => {
  navigateMock.canLink = false
})

const props: DocumentActionProps = {
  id: 'doc-1',
  scopeId: 'scope-1',
  type: 'book',
  transactionSyncLock: null,
  draft: null,
  published: null,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  initialValueResolved: true,
  // oxlint-disable-next-line @typescript-eslint/no-deprecated -- required by the action's props
  onComplete: () => {},
}

it('hides "Link to Canvas" for an unlisted org while "Edit in Canvas" keeps isAvailable', async () => {
  // Start listed so the settled label proves the locale bundle loaded before the flip.
  navigateMock.canLink = true
  const {result, rerender} = renderHook(() => useLinkToCanvasAction(props), {wrapper: TestProvider})
  await waitFor(() => expect(result.current?.label).toBe('Link to Canvas'))

  // Unlist the org: the gate must hide the action on the next render.
  navigateMock.canLink = false
  rerender()
  expect(result.current).toBeNull()
})
