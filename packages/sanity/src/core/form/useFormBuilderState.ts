import {type Path} from '@sanity/types'
import {isEqual, pathFor, resolveKeyedPath} from '@sanity/util/paths'
import {
  type RefObject,
  useCallback,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import {EMPTY_ARRAY} from '../util/empty'
import {applyAll} from './patch/applyPatch'
import {type PatchEvent} from './patch/PatchEvent'
import {setAtPath} from './store/stateTreeHelper'
import {type StateTree} from './store/types/state'
import {type FormState} from './store/useFormState'
import {getExpandOperations} from './store/utils/getExpandOperations'

/**
 * @internal
 */
export interface UseFormBuilderStateOptions {
  /**
   * Seeds `focusPath` and `openPath`. Collapsed ancestors are expanded once
   * `useBindFormBuilderState` sees `ready`.
   */
  initialFocusPath?: Path
  /**
   * Called when the focus path changes, including blur (an empty path) and
   * programmatic focus. A repeated focus report for the path already stored
   * does not call it.
   */
  onFocusPath?: (path: Path) => void
}

/**
 * Focus, open, and collapse state that `FormBuilder` and `useFormState` read.
 *
 * `onPathFocus` / `onPathBlur` / `onPathOpen` / `onSetPathCollapsed` /
 * `onSetFieldSetCollapsed` / `onFieldGroupSelect` are the `FormBuilder` props
 * of the same name. `fieldGroupState` is only an input to `useFormState`.
 *
 * @internal
 */
export interface FormBuilderState {
  focusPath: Path
  openPath: Path
  collapsedPaths: StateTree<boolean> | undefined
  collapsedFieldSets: StateTree<boolean> | undefined
  fieldGroupState: StateTree<string> | undefined
  /**
   * Latest form state published by `useBindFormBuilderState`. The mounting
   * commit publishes it in a layout effect, so child effects can expand a
   * path; later commits publish it in an effect. `DocumentPaneProvider` reads
   * this for the URL focus sync.
   */
  formStateRef: RefObject<FormState | null>
  onPathFocus: (nextFocusPath: Path) => void
  onPathBlur: (blurredPath: Path) => void
  onPathOpen: (path: Path) => void
  onProgrammaticFocus: (nextPath: Path) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  onFieldGroupSelect: (path: Path, groupName: string) => void
  /**
   * Applies `initialFocusPath` against the bound form state. `useBindFormBuilderState`
   * calls this once, when `ready` becomes true. A second call expands ancestors again.
   */
  applyInitialFocusPath: () => void
}

/**
 * In-memory focus, open, and collapse state for any form drawn with
 * `useFormState` and `FormBuilder`, including one that is not a document.
 *
 * The hook does not read document ids, edit state, operations, presence,
 * perspective, or connection state. Call `useBindFormBuilderState` with the
 * `useFormState` result on every render so opening a path can expand collapsed
 * ancestors. Without that call, `onPathOpen` does nothing.
 *
 * @internal
 */
export function useFormBuilderState(options: UseFormBuilderStateOptions = {}): FormBuilderState {
  const {initialFocusPath, onFocusPath} = options
  const [focusPath, setFocusPath] = useState<Path>(initialFocusPath || EMPTY_ARRAY)
  const [openPath, onSetOpenPath] = useState<Path>(initialFocusPath || EMPTY_ARRAY)
  // Mirrors `openPath` so focus handling sees writes made earlier in the same tick,
  // before the state update has been rendered.
  const openPathRef = useRef<Path>(openPath)
  const [fieldGroupState, setFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, setCollapsedPaths] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, setCollapsedFieldSets] = useState<StateTree<boolean>>()
  const formStateRef = useRef<FormState | null>(null)

  // Starts as a fresh array, not `EMPTY_ARRAY`, even when `initialFocusPath` seeds
  // the state. The first blur compares with `!== EMPTY_ARRAY` and must still report
  // the empty path; the ready-gated apply writes the ref itself.
  const focusPathRef = useRef<Path>([])

  const onSetPathCollapsed = (path: Path, collapsed: boolean) => {
    setCollapsedPaths((prevState) => setAtPath(prevState, path, collapsed))
  }

  const onSetFieldSetCollapsed = (path: Path, collapsed: boolean) => {
    setCollapsedFieldSets((prevState) => setAtPath(prevState, path, collapsed))
  }

  const onFieldGroupSelect = (path: Path, groupName: string) => {
    setFieldGroupState((prevState) => setAtPath(prevState, path, groupName))
  }

  const onPathOpen = (path: Path) => {
    if (!formStateRef.current) return
    const ops = getExpandOperations(formStateRef.current, path)
    ops.forEach((op) => {
      if (op.type === 'expandPath') {
        setCollapsedPaths((prevState) => setAtPath(prevState, op.path, false))
      }
      if (op.type === 'expandFieldSet') {
        setCollapsedFieldSets((prevState) => setAtPath(prevState, op.path, false))
      }
      if (op.type === 'setSelectedGroup') {
        setFieldGroupState((prevState) => setAtPath(prevState, op.path, op.groupName))
      }
    })
    openPathRef.current = path
    onSetOpenPath(path)
  }

  const onPathFocus = (nextFocusPathInput: Path) => {
    const nextFocusPath = pathFor(nextFocusPathInput)
    if (nextFocusPath !== focusPathRef.current) {
      setFocusPath(pathFor(nextFocusPath))

      // Focusing a field inside a nested object reveals the dialog that edits it, so
      // `openPath` follows the focused field's parent. An array item reports its own
      // path as the focus path though, so when focus lands on whatever is already open
      // — a Portable Text block object re-reporting the editor selection, for instance —
      // stepping one segment up from there would close the dialog editing it.
      if (!isEqual(openPathRef.current, nextFocusPath)) {
        onPathOpen(pathFor(nextFocusPath.slice(0, -1)))
      }

      focusPathRef.current = nextFocusPath
      onFocusPath?.(nextFocusPath)
    }
  }

  const onPathBlur = (_blurredPath: Path) => {
    setFocusPath(EMPTY_ARRAY)

    if (focusPathRef.current !== EMPTY_ARRAY) {
      focusPathRef.current = EMPTY_ARRAY
      onFocusPath?.(EMPTY_ARRAY)
    }
  }

  const onProgrammaticFocus = (nextPath: Path) => {
    // Supports changing the focus path not by a user interaction, but by a programmatic change, e.g. the url path changes.
    if (!isEqual(focusPathRef.current, nextPath)) {
      setFocusPath(nextPath)
      onPathOpen(nextPath)
      onFocusPath?.(nextPath)

      focusPathRef.current = nextPath
    }
  }

  const onPathOpenRef = useRef(onPathOpen)
  const initialFocusPathRef = useRef(initialFocusPath)
  const onFocusPathRef = useRef(onFocusPath)
  useInsertionEffect(() => {
    onPathOpenRef.current = onPathOpen
    initialFocusPathRef.current = initialFocusPath
    onFocusPathRef.current = onFocusPath
  }, [initialFocusPath, onFocusPath, onPathOpen])

  const applyInitialFocusPath = useCallback(() => {
    const path = initialFocusPathRef.current
    if (!path || path.length === 0) return
    const resolvedPath = resolveKeyedPath(formStateRef.current?.value, path)

    // Apply unconditionally rather than through `onProgrammaticFocus`: its change
    // detection compares against `focusPathRef`, which may already match the target path
    // (the state was seeded from `initialFocusPath`, and e.g. dialog autofocus can align
    // the ref before the form is ready) — and the expand operations must still run.
    setFocusPath(resolvedPath)
    onPathOpenRef.current(resolvedPath)
    onFocusPathRef.current?.(resolvedPath)
    focusPathRef.current = resolvedPath
  }, [])

  return {
    focusPath,
    openPath,
    collapsedPaths,
    collapsedFieldSets,
    fieldGroupState,
    formStateRef,
    onPathFocus,
    onPathBlur,
    onPathOpen,
    onProgrammaticFocus,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
    onFieldGroupSelect,
    applyInitialFocusPath,
  }
}

/**
 * Publishes `formState` onto the builder state and applies `initialFocusPath`
 * once `ready` is true.
 *
 * The mounting commit publishes `formState` in a layout effect, before child
 * effects, which is what lets autofocus expand a path. Later commits publish
 * it in an effect, after those child effects, matching the document form.
 * Pass the document form's connection/edit `ready` flag, or `true` when the
 * value is already loaded.
 *
 * @internal
 */
export function useBindFormBuilderState(
  state: FormBuilderState,
  formState: FormState | null,
  ready: boolean,
): void {
  const {formStateRef, applyInitialFocusPath} = state
  const hasMounted = useRef(false)

  useLayoutEffect(() => {
    if (hasMounted.current) return
    formStateRef.current = formState
  }, [formState, formStateRef])

  useEffect(() => {
    hasMounted.current = true
    formStateRef.current = formState
  }, [formState, formStateRef])

  // Seeding `focusPath`/`openPath` from `initialFocusPath` is not enough to reveal
  // the target field: expanding collapsed ancestors requires the form state. Apply
  // once, as soon as `ready` is true. A caller that passes `ready` on the first
  // render still waits for this effect, which runs after the ref assignment above.
  const initialFocusPathAppliedRef = useRef(false)
  useEffect(() => {
    if (!ready || initialFocusPathAppliedRef.current) return
    initialFocusPathAppliedRef.current = true
    applyInitialFocusPath()
  }, [applyInitialFocusPath, ready])
}

/**
 * Applies a `PatchEvent` to `value` with `applyAll` and passes the result to
 * `onValueChange`. The handler reads the latest value and callback, including
 * when an input calls it from an effect on mount.
 *
 * Unsetting the root yields `undefined`, which is what `applyAll` returns.
 *
 * @internal
 */
export function useFormPatchHandler<T>(
  value: T,
  onValueChange: (next: T) => void,
): (event: PatchEvent) => void {
  const valueRef = useRef(value)
  const onValueChangeRef = useRef(onValueChange)
  useInsertionEffect(() => {
    valueRef.current = value
    onValueChangeRef.current = onValueChange
  }, [onValueChange, value])

  return useCallback((event: PatchEvent) => {
    onValueChangeRef.current(applyAll(valueRef.current, event.patches))
  }, [])
}
