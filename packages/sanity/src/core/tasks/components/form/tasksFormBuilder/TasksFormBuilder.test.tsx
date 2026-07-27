import {render, screen} from '@testing-library/react'
import {PerspectiveContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {type PerspectiveContextValue} from '../../../../perspective/types'
import {type SystemVariant} from '../../../../variants/types'
import {TasksFormBuilder} from './TasksFormBuilder'

// Replaces the addon workspace provider with a probe that exposes the perspective context the
// task form would be mounted with, without rendering the (heavy) form itself.
vi.mock('../addonWorkspace', async () => {
  const {usePerspective} = await import('../../../../perspective/usePerspective')

  function TasksAddonWorkspaceProvider() {
    const {selectedVariantName, selectedVariant, selectedPerspectiveName} = usePerspective()
    return (
      <div
        data-testid="addon-workspace"
        data-selected-variant-name={selectedVariantName ?? 'none'}
        data-has-selected-variant={selectedVariant ? 'true' : 'false'}
        data-selected-perspective-name={selectedPerspectiveName ?? 'none'}
      />
    )
  }

  return {TasksAddonWorkspaceProvider}
})

vi.mock('../../../context', () => ({
  MentionUserProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  useMentionUser: () => ({setSelectedDocument: vi.fn()}),
  useTasks: () => ({activeDocument: null, data: [], isLoading: false}),
  useTasksNavigation: () => ({
    state: {selectedTask: 'task-1', viewMode: 'create', duplicateTaskValues: undefined},
  }),
}))

vi.mock('../../../../store', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCurrentUser: () => ({id: 'user-1'}),
}))

vi.mock('../../../../studio/workspace', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWorkspace: () => ({
    dataset: 'test-dataset',
    projectId: 'test-project',
    document: {drafts: {enabled: true}},
  }),
}))

vi.mock('../../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: () => ({data: [], error: undefined, loading: false, dispatch: vi.fn()}),
}))

vi.mock('../../../../variants/store/useAllVariants', () => ({
  useAllVariants: () => ({data: [], byId: new Map(), error: undefined, loading: false}),
}))

const variant = {
  _id: '_.variants.alpha-audience',
  _type: 'system.variant',
} as unknown as SystemVariant

function createOuterPerspective(
  overrides: Partial<PerspectiveContextValue>,
): PerspectiveContextValue {
  return {
    selectedPerspectiveName: undefined,
    selectedReleaseId: undefined,
    selectedPerspective: 'drafts',
    perspectiveStack: ['drafts'],
    excludedPerspectives: [],
    selectedVariantName: undefined,
    selectedVariant: undefined,
    bundle: 'drafts',
    ...overrides,
  }
}

function renderWithPerspective(outer: PerspectiveContextValue) {
  return render(
    <PerspectiveContext.Provider value={outer}>
      <TasksFormBuilder />
    </PerspectiveContext.Provider>,
  )
}

describe('TasksFormBuilder', () => {
  it('does not let the task form inherit the selected variant', () => {
    renderWithPerspective(
      createOuterPerspective({
        selectedVariantName: 'alpha-audience',
        selectedVariant: variant,
      }),
    )

    // Task documents never have variant-scoped versions; inheriting the variant would make
    // `useDocumentForm` treat the target as missing and block all edits.
    const probe = screen.getByTestId('addon-workspace')
    expect(probe).toHaveAttribute('data-selected-variant-name', 'none')
    expect(probe).toHaveAttribute('data-has-selected-variant', 'false')
  })

  it('keeps the selected release perspective for the task form', () => {
    renderWithPerspective(
      createOuterPerspective({
        selectedPerspectiveName: 'rSomeRelease',
        selectedReleaseId: 'rSomeRelease',
        selectedPerspective: 'rSomeRelease',
        perspectiveStack: ['rSomeRelease', 'drafts'],
        selectedVariantName: 'alpha-audience',
        selectedVariant: variant,
      }),
    )

    const probe = screen.getByTestId('addon-workspace')
    expect(probe).toHaveAttribute('data-selected-perspective-name', 'rSomeRelease')
    expect(probe).toHaveAttribute('data-selected-variant-name', 'none')
  })
})
