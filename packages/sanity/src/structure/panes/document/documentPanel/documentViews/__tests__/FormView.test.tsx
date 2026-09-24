import {focusFirstDescendant} from '@sanity/ui'
import {render, type RenderResult, screen} from '@testing-library/react'
import {EMPTY} from 'rxjs'
import {test as baseTest, describe, expect, type Mock, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useDocumentPane} from '../../../useDocumentPane'
import {useDocumentTitle} from '../../../useDocumentTitle'
import {FormView} from '../FormView'

vi.mock('@sanity/ui', async (importOriginal) => {
  const ui = (await importOriginal()) as Record<string, unknown>
  return {
    ...ui,
    focusFirstDescendant: vi.fn(),
  }
})

vi.mock('sanity', async (importOriginal) => {
  const sanity = (await importOriginal()) as Record<string, unknown>
  return {
    ...sanity,
    useDocumentStore: vi.fn(() => ({
      pair: {
        documentEvents: vi.fn(() => EMPTY),
      },
    })),
    useDocumentPresence: vi.fn(() => []),
    useConditionalToast: vi.fn(),
  }
})

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(() => ({title: 'Test Title'})),
}))

const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>
const mockUseDocumentTitle = useDocumentTitle as MockedFunction<typeof useDocumentTitle>
const mockFocusFirstDescendant = focusFirstDescendant as Mock<typeof focusFirstDescendant>

type DocumentPaneValue = ReturnType<typeof useDocumentPane>

function buildDocumentPaneValue(overrides: Partial<DocumentPaneValue> = {}): DocumentPaneValue {
  return {
    collapsedFieldSets: undefined,
    collapsedPaths: undefined,
    displayed: {_id: 'test-id', _type: 'testType'},
    editState: {
      id: 'test-id',
      type: 'testType',
      transactionSyncLock: {enabled: false},
      liveEdit: false,
      ready: true,
      draft: null,
      published: null,
      version: undefined,
    },
    documentId: 'test-id',
    documentType: 'testType',
    fieldActions: [],
    onChange: vi.fn(),
    validation: [],
    ready: true,
    formState: null,
    onFocus: vi.fn(),
    connectionState: 'connected',
    onBlur: vi.fn(),
    onSetCollapsedPath: vi.fn(),
    onPathOpen: vi.fn(),
    onSetCollapsedFieldSet: vi.fn(),
    onSetActiveFieldGroup: vi.fn(),
    openPath: [],
    inspectOpen: false,
    compareValue: null,
    hasUpstreamVersion: false,
    focusPath: [],
    targetDocumentState: {
      status: 'ready',
      targetDocument: undefined,
      scopeId: undefined,
      variant: undefined,
      siblings: {published: undefined, draft: undefined, version: undefined},
    },
    ...overrides,
  } as unknown as DocumentPaneValue
}

interface FormViewFixtures {
  /**
   * The mocked `focusFirstDescendant` from `@sanity/ui`. Call history is
   * cleared before each test and again on teardown.
   */
  focusFirstDescendantSpy: Mock<typeof focusFirstDescendant>
  /**
   * Configures the mocked `useDocumentPane` to return a document pane value
   * with the provided overrides applied to a sensible default. A baseline
   * value is applied before every test, and the mock is fully reset on
   * teardown.
   */
  setDocumentPane: (overrides?: Partial<DocumentPaneValue>) => void
  /**
   * Renders the `FormView` under test (with `hidden` set to bypass
   * `FormBuilder` — the auto-focus effect does not depend on this prop).
   * Returns the testing-library result with a no-argument `rerender` helper
   * for repeating the same render with updated mock state. The rendered tree
   * is unmounted on teardown.
   */
  renderFormView: () => RenderResult & {rerender: () => void}
}

const test = baseTest.extend<FormViewFixtures>({
  // oxlint-disable-next-line no-empty-pattern
  focusFirstDescendantSpy: async ({}, consume) => {
    mockFocusFirstDescendant.mockClear()
    await consume(mockFocusFirstDescendant)
    mockFocusFirstDescendant.mockClear()
  },
  // oxlint-disable-next-line no-empty-pattern
  setDocumentPane: async ({}, consume) => {
    const setDocumentPane = (overrides: Partial<DocumentPaneValue> = {}) => {
      mockUseDocumentPane.mockReturnValue(buildDocumentPaneValue(overrides))
    }
    // Apply a baseline value so tests that render without explicitly
    // configuring the document pane don't crash on undefined return values.
    setDocumentPane()
    await consume(setDocumentPane)
    mockUseDocumentPane.mockReset()
  },
  // oxlint-disable-next-line no-empty-pattern
  renderFormView: async ({}, consume) => {
    mockUseDocumentTitle.mockReturnValue({title: 'Test Title'})
    const wrapper = await createTestProvider()
    const formViewElement = <FormView hidden margins={[0, 0, 0, 0]} />
    let rendered: RenderResult | undefined

    const renderFormView = () => {
      const result = render(formViewElement, {wrapper})
      rendered = result
      // Capture the original `rerender` so the wrapper below doesn't recurse
      // into itself when invoked.
      const originalRerender = result.rerender
      return Object.assign(result, {
        rerender: () => originalRerender(formViewElement),
      })
    }

    await consume(renderFormView)

    rendered?.unmount()
    mockUseDocumentTitle.mockReset()
  },
})

describe('FormView', () => {
  describe('auto-focus behavior', () => {
    test('auto-focuses the first descendant when no path is focused on mount', ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      setDocumentPane({focusPath: []})
      renderFormView()

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)
    })

    test('does not auto-focus when a path is already focused on mount (deep-link)', ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      setDocumentPane({
        focusPath: ['title'],
        formState: {focusPath: ['title']} as DocumentPaneValue['formState'],
      })
      renderFormView()

      expect(focusFirstDescendantSpy).not.toHaveBeenCalled()
    })

    test('does not auto-focus after a deep-linked path is blurred', ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      // Initial render: deep-link focuses a path.
      setDocumentPane({
        focusPath: ['title'],
        formState: {focusPath: ['title']} as DocumentPaneValue['formState'],
      })
      const {rerender} = renderFormView()

      expect(focusFirstDescendantSpy).not.toHaveBeenCalled()

      // User blurs the deep-linked path: focusPath becomes empty. Auto-focus
      // must NOT run, because the user already had a focused path.
      setDocumentPane({
        focusPath: [],
        // @ts-expect-error -- pre-existing, fix later
        formState: {focusPath: []} as DocumentPaneValue['formState'],
      })
      rerender()

      expect(focusFirstDescendantSpy).not.toHaveBeenCalled()
    })

    test('does not auto-focus again after an initially auto-focused path is blurred', ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      // Initial render: no focused path, so auto-focus kicks in.
      setDocumentPane({focusPath: []})
      const {rerender} = renderFormView()

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)

      // Simulate a path getting focused (e.g. by the auto-focus mechanism, or
      // by the user).
      setDocumentPane({
        focusPath: ['title'],
        formState: {focusPath: ['title']} as DocumentPaneValue['formState'],
      })
      rerender()

      // The user blurs the path: focusPath becomes empty again. Auto-focus
      // must not run a second time.
      setDocumentPane({focusPath: []})
      rerender()

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)
    })

    test('focuses the first descendant once the form content appears after mount', async ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      // Lazy form middleware suspends FormBuilder on first render, so the form element commits
      // with nothing focusable in it and the first attempt finds nothing.
      focusFirstDescendantSpy.mockReturnValueOnce(false).mockReturnValue(true)
      setDocumentPane({focusPath: []})
      renderFormView()

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)

      // The boundary resolves and the inputs land in the form.
      const form = screen.getByTestId('form-view')
      await appendAndFlush(form)

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(2)

      // Focus landed, so later DOM changes in the form are left alone.
      await appendAndFlush(form)

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(2)
    })

    test('does not watch the form once the first attempt focused a descendant', async ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      focusFirstDescendantSpy.mockReturnValue(true)
      setDocumentPane({focusPath: []})
      renderFormView()

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)

      await appendAndFlush(screen.getByTestId('form-view'))

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)
    })

    test('leaves focus where the user put it while the form content was loading', async ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      focusFirstDescendantSpy.mockReturnValue(false)
      setDocumentPane({focusPath: []})
      renderFormView()

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)

      // The user clicks into search (or any other UI) before the lazy form component resolves.
      const search = appendFocusable(document.body)
      search.focus()
      expect(search).toHaveFocus()

      const form = screen.getByTestId('form-view')
      await appendAndFlush(form)

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)
      expect(search).toHaveFocus()

      // The observer stood down for good, not just for this mutation.
      await appendAndFlush(form)

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)
      search.remove()
    })

    test('stands down when focus visited another control and came back to the opener', async ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      const listItem = appendFocusable(document.body)
      listItem.focus()

      focusFirstDescendantSpy.mockReturnValue(false)
      setDocumentPane({focusPath: []})
      renderFormView()

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)

      // The user clicks into search and then back onto the list item while the form loads. At
      // mutation time focus sits where it did on commit, but the user has been interacting.
      const search = appendFocusable(document.body)
      search.focus()
      listItem.focus()
      expect(listItem).toHaveFocus()

      await appendAndFlush(screen.getByTestId('form-view'))

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)
      expect(listItem).toHaveFocus()
      search.remove()
      listItem.remove()
    })

    test('still focuses the form when the element focused before it mounted keeps focus', async ({
      focusFirstDescendantSpy,
      setDocumentPane,
      renderFormView,
    }) => {
      // The list item that opened the document holds focus when the form commits. The synchronous
      // attempt would take focus from it, so the deferred attempt does too.
      const listItem = appendFocusable(document.body)
      listItem.focus()

      focusFirstDescendantSpy.mockReturnValueOnce(false).mockReturnValue(true)
      setDocumentPane({focusPath: []})
      renderFormView()

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(1)
      expect(listItem).toHaveFocus()

      await appendAndFlush(screen.getByTestId('form-view'))

      expect(focusFirstDescendantSpy).toHaveBeenCalledTimes(2)
      listItem.remove()
    })
  })
})

/** Adds a node to `parent` and waits for MutationObserver callbacks to be delivered. */
async function appendAndFlush(parent: HTMLElement) {
  parent.appendChild(document.createElement('input'))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Adds a focusable element outside the form, standing in for search, another pane, or a menu. */
function appendFocusable(parent: HTMLElement) {
  const button = document.createElement('button')
  parent.appendChild(button)
  return button
}
