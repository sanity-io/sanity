import {describe, expect, it} from 'vitest'

import {LOADING_PANE} from '../../../constants'
import {type PaneNode} from '../../../types'
import {getMaximizedPaneTransition} from '../getMaximizedPaneTransition'

/**
 * Covers the "maximize-sync effect skips transient snapshots" claim from the
 * pane-tree-stays-live design: while intent resolution is in flight or
 * loading placeholders replace real panes, the pane set is transient, and
 * acting on it could drop the maximize state (the maximized key appears
 * missing) or follow the wrong pane. The settled-snapshot decisions (follow
 * the moved selection, fall back when the maximized pane disappears) are
 * covered alongside, so regressions in either direction are caught.
 */

interface TestPaneData {
  key: string
  groupIndex: number
  siblingIndex: number
  selected: boolean
  pane: PaneNode | typeof LOADING_PANE
}

function documentPane(key: string, options: Partial<TestPaneData> = {}): TestPaneData {
  return {
    key,
    groupIndex: 0,
    siblingIndex: 0,
    selected: false,
    pane: {id: key, type: 'document'} as PaneNode,
    ...options,
  }
}

function listPane(key: string, options: Partial<TestPaneData> = {}): TestPaneData {
  return {
    key,
    groupIndex: 0,
    siblingIndex: 0,
    selected: false,
    pane: {id: key, type: 'list'} as PaneNode,
    ...options,
  }
}

function loadingPane(key: string, options: Partial<TestPaneData> = {}): TestPaneData {
  return {
    key,
    groupIndex: 0,
    siblingIndex: 0,
    selected: false,
    pane: LOADING_PANE,
    ...options,
  }
}

describe('getMaximizedPaneTransition', () => {
  describe('transient snapshots are skipped (maximize state survives navigation churn)', () => {
    it('skips while intent resolution is in flight', () => {
      const maximized = documentPane('doc-a')
      expect(
        getMaximizedPaneTransition({
          isResolvingIntent: true,
          // An intent state has no router panes, so the set collapses to the
          // root — the maximized key appears missing. Acting here would drop
          // the maximize state.
          paneDataItems: [listPane('root', {selected: true})],
          maximizedPane: maximized,
          previousSelectedIndex: 1,
        }),
      ).toEqual({type: 'skip-transient'})
    })

    it('skips while any pane is a loading placeholder', () => {
      const maximized = documentPane('doc-a')
      expect(
        getMaximizedPaneTransition({
          isResolvingIntent: false,
          // Mid-navigation the target pane resolves asynchronously: the real
          // pane is temporarily replaced by a loading placeholder while the
          // selection has already moved.
          paneDataItems: [listPane('root'), loadingPane('loading-b', {selected: true})],
          maximizedPane: maximized,
          previousSelectedIndex: 1,
        }),
      ).toEqual({type: 'skip-transient'})
    })

    it('churn sequence: maximize state survives a loading snapshot and follows the settled selection', () => {
      // The claim, as a sequence. A document is maximized; the user opens a
      // referenced document to the right. The pane stream first emits a
      // transient snapshot (loading placeholder), then the settled one.
      const docA = documentPane('doc-a', {groupIndex: 1, selected: true})
      let previousSelectedIndex = 1

      // Settled baseline: doc-a selected and maximized.
      const baseline = getMaximizedPaneTransition({
        isResolvingIntent: false,
        paneDataItems: [listPane('root'), docA],
        maximizedPane: docA,
        previousSelectedIndex,
      })
      expect(baseline).toEqual({type: 'keep', selectedIndex: 1})
      previousSelectedIndex = 1

      // Transient snapshot: doc-b still resolving. Without the skip, the
      // "follow selection" branch would run against the placeholder and
      // maximize a loading pane (or the cleanup branch could drop the state).
      const transient = getMaximizedPaneTransition({
        isResolvingIntent: false,
        paneDataItems: [
          listPane('root'),
          documentPane('doc-a', {groupIndex: 1}),
          loadingPane('loading-doc-b', {groupIndex: 2, selected: true}),
        ],
        maximizedPane: docA,
        previousSelectedIndex,
      })
      expect(transient).toEqual({type: 'skip-transient'})
      // skip-transient means the previous selected index is NOT committed —
      // the settled snapshot below is compared against the settled baseline.

      // Settled snapshot: doc-b resolved and selected. The selection moved
      // (1 -> 2 against the last settled index), so maximize follows it.
      const docB = documentPane('doc-b', {groupIndex: 2, selected: true})
      const settled = getMaximizedPaneTransition({
        isResolvingIntent: false,
        paneDataItems: [listPane('root'), documentPane('doc-a', {groupIndex: 1}), docB],
        maximizedPane: docA,
        previousSelectedIndex,
      })
      expect(settled).toEqual({type: 'set', pane: docB, selectedIndex: 2})
    })
  })

  describe('settled snapshots', () => {
    it('keeps (and records the selected index) when nothing is maximized', () => {
      expect(
        getMaximizedPaneTransition({
          isResolvingIntent: false,
          paneDataItems: [listPane('root'), documentPane('doc-a', {selected: true})],
          maximizedPane: null,
          previousSelectedIndex: -1,
        }),
      ).toEqual({type: 'keep', selectedIndex: 1})
    })

    it('clears a non-document maximized pane', () => {
      const maximizedList = listPane('some-list')
      expect(
        getMaximizedPaneTransition({
          isResolvingIntent: false,
          paneDataItems: [listPane('root', {selected: true})],
          maximizedPane: maximizedList,
          previousSelectedIndex: 0,
        }),
      ).toEqual({type: 'set', pane: null, selectedIndex: 0})
    })

    it('follows the newly selected pane when the selection moves', () => {
      const docA = documentPane('doc-a', {groupIndex: 1})
      const docB = documentPane('doc-b', {groupIndex: 2, selected: true})
      expect(
        getMaximizedPaneTransition({
          isResolvingIntent: false,
          paneDataItems: [listPane('root'), docA, docB],
          maximizedPane: docA,
          previousSelectedIndex: 1,
        }),
      ).toEqual({type: 'set', pane: docB, selectedIndex: 2})
    })

    it('keeps the maximized pane when the selection has not moved', () => {
      const docA = documentPane('doc-a', {groupIndex: 1, selected: true})
      expect(
        getMaximizedPaneTransition({
          isResolvingIntent: false,
          paneDataItems: [listPane('root'), docA],
          maximizedPane: docA,
          previousSelectedIndex: 1,
        }),
      ).toEqual({type: 'keep', selectedIndex: 1})
    })

    it('falls back to the document pane at the same position when the maximized pane disappears', () => {
      const replacement = documentPane('doc-replacement', {
        groupIndex: 1,
        siblingIndex: 0,
        selected: true,
      })
      expect(
        getMaximizedPaneTransition({
          isResolvingIntent: false,
          paneDataItems: [listPane('root'), replacement],
          maximizedPane: documentPane('doc-gone', {groupIndex: 1, siblingIndex: 0}),
          // Selection index unchanged, so the follow branch does not apply.
          previousSelectedIndex: 1,
        }),
      ).toEqual({type: 'set', pane: replacement, selectedIndex: 1})
    })

    it('clears when the maximized pane disappears and no document pane occupies its position', () => {
      expect(
        getMaximizedPaneTransition({
          isResolvingIntent: false,
          paneDataItems: [listPane('root', {selected: true})],
          maximizedPane: documentPane('doc-gone', {groupIndex: 1, siblingIndex: 0}),
          previousSelectedIndex: 0,
        }),
      ).toEqual({type: 'set', pane: null, selectedIndex: 0})
    })
  })
})
