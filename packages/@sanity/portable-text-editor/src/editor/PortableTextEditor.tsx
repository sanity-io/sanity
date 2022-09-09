import React from 'react'
import {ArraySchemaType, Path} from '@sanity/types'
import {Subscription, Subject, defer, of, EMPTY, Observable, OperatorFunction} from 'rxjs'
import {concatMap, share, switchMap, tap} from 'rxjs/operators'
import {randomKey} from '@sanity/util/content'
import {createEditor, Descendant, Transforms} from 'slate'
import {debounce, isEqual, throttle} from 'lodash'
import {Slate, withReact} from '@sanity/slate-react'
import {compileType} from '../utils/schema'
import {getPortableTextFeatures} from '../utils/getPortableTextFeatures'
import {PortableTextBlock, PortableTextFeatures, PortableTextChild} from '../types/portableText'
import {RawType, Type} from '../types/schema'
import type {Patch} from '../types/patch'
import {
  EditorSelection,
  EditorChange,
  EditorChanges,
  EditableAPI,
  InvalidValueResolution,
  PatchObservable,
  PortableTextSlateEditor,
  EditableAPIDeleteOptions,
} from '../types/editor'
import {validateValue} from '../utils/validateValue'
import {debugWithName} from '../utils/debug'
import {getValueOrInitialValue, isEqualToEmptyEditor, toSlateValue} from '../utils/values'
import {KEY_TO_SLATE_ELEMENT, KEY_TO_VALUE_ELEMENT} from '../utils/weakMaps'
import {PortableTextEditorContext} from './hooks/usePortableTextEditor'
import {PortableTextEditorSelectionContext} from './hooks/usePortableTextEditorSelection'
import {PortableTextEditorReadOnlyContext} from './hooks/usePortableTextReadOnly'
import {PortableTextEditorValueContext} from './hooks/usePortableTextEditorValue'
import {withPlugins} from './plugins'

// Debounce time for flushing local patches (ms since user haven't produced a patch)
// (lower time for tests to speed them up)
export const FLUSH_PATCHES_DEBOUNCE_MS = process.env.NODE_ENV === 'test' ? 50 : 1000

export const defaultKeyGenerator = () => randomKey(12)

const debug = debugWithName('component:PortableTextEditor')

/**
 * Props for the PortableTextEditor component
 *
 * @public
 */
/**
 * Props for the PortableTextEditor component
 *
 * @public
 */
export interface PortableTextEditorProps {
  /**
   * Function that gets called when the editor changes the value
   */
  onChange: (change: EditorChange) => void

  /**
   * (Compiled or raw JSON) schema type for the portable text field
   */
  type: ArraySchemaType<PortableTextBlock> | RawType

  /**
   * Maximum number of blocks to allow within the editor
   */
  maxBlocks?: number | string

  /**
   * Whether or not the editor should be in read-only mode
   */
  readOnly?: boolean

  /**
   * The current value of the portable text field
   */
  value?: PortableTextBlock[]

  /**
   * Function used to generate keys for array items (`_key`)
   */
  keyGenerator?: () => string

  /**
   * Observable of incoming patches - used for undo/redo operations,
   * adjusting editor selections on concurrent editing and similar
   */
  incomingPatches$?: PatchObservable
}

/**
 * @internal
 */

export interface PortableTextEditorState {
  invalidValueResolution: InvalidValueResolution | null
  selection: EditorSelection | null
  initialValue: Descendant[]
}
export class PortableTextEditor extends React.Component<
  PortableTextEditorProps,
  PortableTextEditorState
> {
  public change$: EditorChanges = new Subject()
  public keyGenerator: () => string
  public maxBlocks: number | undefined
  public portableTextFeatures: PortableTextFeatures
  public readOnly: boolean
  public slateInstance: PortableTextSlateEditor
  public type: ArraySchemaType<PortableTextBlock>
  public incomingPatches$?: PatchObservable

  private changeSubscription: Subscription
  private editable?: EditableAPI
  private pendingPatches: Patch[] = []
  private returnedPatches: Patch[] = []
  hasPendingLocalPatches: React.MutableRefObject<boolean | null>

  constructor(props: PortableTextEditorProps) {
    super(props)

    if (!props.type) {
      throw new Error('PortableTextEditor: missing "type" property')
    }

    this.hasPendingLocalPatches = React.createRef()
    this.hasPendingLocalPatches.current = false

    this.state = {
      invalidValueResolution: null,
      selection: null,
      initialValue: [], // Created in the constructor
    }

    // Test if we have a compiled schema type, if not, conveniently compile it
    this.type = props.type.hasOwnProperty('jsonType') ? props.type : compileType(props.type)
    // Indicate that we are loading
    this.change$.next({type: 'loading', isLoading: true})

    // Get the block types feature set (lookup table)
    this.portableTextFeatures = getPortableTextFeatures(this.type)

    // Setup keyGenerator (either from props, or default)
    this.keyGenerator = props.keyGenerator || defaultKeyGenerator

    // Setup processed incoming patches stream
    if (props.incomingPatches$) {
      // Buffer patches until we are no longer producing local patches
      this.incomingPatches$ = props.incomingPatches$
        .pipe(
          tap(({patches}: {patches: Patch[]; snapshot: PortableTextBlock[] | undefined}) => {
            // Reset hasPendingLocalPatches when local patches are returned
            if (patches.some((p) => p.origin === 'local')) {
              this.hasPendingLocalPatches.current = false
            }
          })
        )
        .pipe(
          bufferUntil(() => !this.hasPendingLocalPatches.current),
          concatMap((incoming) => {
            return incoming
          }),
          share()
        )
    }

    // Subscribe to editor events and set state for selection and pending patches
    this.changeSubscription = this.change$.subscribe((next: EditorChange): void => {
      const {onChange} = this.props
      switch (next.type) {
        case 'patch':
          this.pendingPatches.push(next.patch)
          if (this.props.incomingPatches$) {
            this.hasPendingLocalPatches.current = true
          }
          this.flushDebounced()
          onChange(next)
          break
        case 'selection':
          onChange(next)
          this.setState({selection: next.selection})
          break
        default:
          onChange(next)
      }
    })

    // Set maxBlocks and readOnly
    this.maxBlocks =
      typeof props.maxBlocks === 'undefined'
        ? undefined
        : parseInt(props.maxBlocks.toString(), 10) || undefined
    this.readOnly = Boolean(props.readOnly) || false
    // Validate the incoming value
    if (props.value) {
      const validation = validateValue(props.value, this.portableTextFeatures, this.keyGenerator)
      if (props.value && !validation.valid) {
        this.change$.next({type: 'loading', isLoading: false})
        this.change$.next({
          type: 'invalidValue',
          resolution: validation.resolution,
          value: props.value,
        })
        this.state = {...this.state, invalidValueResolution: validation.resolution}
      }
    }

    // Create the slate instance
    this.slateInstance = withPlugins(withReact(createEditor()), {
      portableTextEditor: this,
    })

    this.state = {
      ...this.state,
      initialValue: toSlateValue(
        getValueOrInitialValue(props.value, [this.slateInstance.createPlaceholderBlock()]),
        {portableTextFeatures: this.portableTextFeatures},
        KEY_TO_SLATE_ELEMENT.get(this.slateInstance)
      ),
    }
    KEY_TO_VALUE_ELEMENT.set(this.slateInstance, {})
    KEY_TO_SLATE_ELEMENT.set(this.slateInstance, {})
  }

  componentWillUnmount() {
    this.flush()
    this.changeSubscription.unsubscribe()
    this.slateInstance.destroy()
  }

  componentDidUpdate(prevProps: PortableTextEditorProps) {
    // Whenever readOnly toggles, recreate the editor's plugin chain
    if (this.props.readOnly !== prevProps.readOnly) {
      this.readOnly = Boolean(this.props.readOnly)
      this.slateInstance = withPlugins(this.slateInstance, {
        portableTextEditor: this,
      })
    }
    // Update the maxBlocks prop
    if (this.props.maxBlocks !== prevProps.maxBlocks) {
      this.maxBlocks =
        typeof this.props.maxBlocks === 'undefined'
          ? undefined
          : parseInt(this.props.maxBlocks.toString(), 10) || undefined
      this.slateInstance.maxBlocks = this.maxBlocks
    }
    // Sync value from props, but not when we are responding to incoming patches
    // (if this is the case, we sync the value after the incoming patches has been processed - see createWithPatches plugin)
    if (
      this.props.value !== prevProps.value &&
      (!prevProps.value || this.readOnly || !this.props.incomingPatches$)
    ) {
      this.syncValue()
    }
  }

  public setEditable = (editable: EditableAPI) => {
    this.editable = {...this.editable, ...editable}
    this.change$.next({type: 'value', value: this.props.value || undefined})
    this.change$.next({type: 'ready'})
  }

  render() {
    if (this.state.invalidValueResolution) {
      return this.state.invalidValueResolution.description
    }

    return (
      <PortableTextEditorContext.Provider value={this}>
        <PortableTextEditorValueContext.Provider value={this.props.value}>
          <PortableTextEditorReadOnlyContext.Provider value={Boolean(this.props.readOnly)}>
            <PortableTextEditorSelectionContext.Provider value={this.state.selection}>
              <Slate onChange={NOOP} editor={this.slateInstance} value={this.state.initialValue}>
                {this.props.children}
              </Slate>
            </PortableTextEditorSelectionContext.Provider>
          </PortableTextEditorReadOnlyContext.Provider>
        </PortableTextEditorValueContext.Provider>
      </PortableTextEditorContext.Provider>
    )
  }

  public syncValue: (userCallbackFn?: () => void) => void = (userCallbackFn) => {
    const val = this.props.value
    const callbackFn = () => {
      debug('Updating slate instance')
      this.slateInstance.onChange()
      this.change$.next({type: 'value', value: val})
      if (userCallbackFn) {
        userCallbackFn()
      }
    }

    if (this.hasPendingLocalPatches.current && !this.readOnly) {
      debug('Not syncing value (has pending local patches)')
      retrySync(() => this.syncValue(), callbackFn)
      return
    }
    // If the  editor is empty and there is a new value, just set that value directly.
    if (
      isEqualToEmptyEditor(this.slateInstance.children, this.portableTextFeatures) &&
      this.props.value
    ) {
      const oldSel = this.slateInstance.selection
      Transforms.deselect(this.slateInstance)
      this.slateInstance.children = toSlateValue(
        val,
        {
          portableTextFeatures: this.portableTextFeatures,
        },
        KEY_TO_SLATE_ELEMENT.get(this.slateInstance)
      )
      if (oldSel) {
        Transforms.select(this.slateInstance, oldSel)
      }
      debug('Setting props.value directly to empty editor')
      callbackFn()
      return
    }
    // Test for diffs between our state value and the incoming value.
    const isEqualToValue = !(val || []).some((blk, index) => {
      const compareBlock = toSlateValue(
        [blk],
        {portableTextFeatures: this.portableTextFeatures},
        KEY_TO_SLATE_ELEMENT.get(this.slateInstance)
      )[0]
      if (!isEqual(compareBlock, this.slateInstance.children[index])) {
        return true
      }
      return false
    })
    if (isEqualToValue) {
      debug('Not syncing value (value is equal)')
      return
    }
    // Value is different - validate it.
    debug('Validating')
    const validation = validateValue(val, this.portableTextFeatures, this.keyGenerator)
    if (val && !validation.valid) {
      this.change$.next({
        type: 'invalidValue',
        resolution: validation.resolution,
        value: val,
      })
      this.setState({invalidValueResolution: validation.resolution})
    }
    // Set the new value
    debug('Replacing changed nodes')
    if (val && val.length > 0) {
      const oldSel = this.slateInstance.selection
      Transforms.deselect(this.slateInstance)
      const slateValueFromProps = toSlateValue(
        val,
        {
          portableTextFeatures: this.portableTextFeatures,
        },
        KEY_TO_SLATE_ELEMENT.get(this.slateInstance)
      )
      this.slateInstance.children = slateValueFromProps
      if (oldSel) {
        Transforms.select(this.slateInstance, oldSel)
      }
    }
    callbackFn()
  }

  private flush = () => {
    const {onChange} = this.props
    const finalPatches = [...this.pendingPatches]
    if (finalPatches.length > 0) {
      debug('Flushing', finalPatches)
      finalPatches.forEach((p) => {
        this.returnedPatches.push(p)
      })
      onChange({type: 'mutation', patches: finalPatches})
      this.pendingPatches = []
    }
  }
  private flushDebounced = debounce(this.flush, FLUSH_PATCHES_DEBOUNCE_MS, {
    leading: false,
    trailing: true,
  })

  // Static API methods
  static activeAnnotations = (editor: PortableTextEditor): PortableTextBlock[] => {
    return editor && editor.editable ? editor.editable.activeAnnotations() : []
  }
  static addAnnotation = (
    editor: PortableTextEditor,
    type: Type,
    value?: {[prop: string]: unknown}
  ): {spanPath: Path; markDefPath: Path} | undefined => editor.editable?.addAnnotation(type, value)
  static blur = (editor: PortableTextEditor): void => {
    debug('Host blurred')
    editor.editable?.blur()
  }
  static delete = (
    editor: PortableTextEditor,
    selection: EditorSelection,
    options?: EditableAPIDeleteOptions
  ) => editor.editable?.delete(selection, options)
  static findDOMNode = (
    editor: PortableTextEditor,
    element: PortableTextBlock | PortableTextChild
  ) => {
    // eslint-disable-next-line react/no-find-dom-node
    return editor.editable?.findDOMNode(element)
  }
  static findByPath = (editor: PortableTextEditor, path: Path) => {
    return editor.editable?.findByPath(path) || []
  }
  static focus = (editor: PortableTextEditor): void => {
    debug('Host requesting focus')
    editor.editable?.focus()
  }
  static focusBlock = (editor: PortableTextEditor) => {
    return editor.editable?.focusBlock()
  }
  static focusChild = (editor: PortableTextEditor): PortableTextChild | undefined => {
    return editor.editable?.focusChild()
  }
  static getPortableTextFeatures = (editor: PortableTextEditor) => {
    return editor.portableTextFeatures
  }
  static getSelection = (editor: PortableTextEditor) => {
    return editor.editable ? editor.editable.getSelection() : null
  }
  static getValue = (editor: PortableTextEditor) => {
    return editor.editable?.getValue()
  }
  static hasBlockStyle = (editor: PortableTextEditor, blockStyle: string) => {
    return editor.editable?.hasBlockStyle(blockStyle)
  }
  static hasListStyle = (editor: PortableTextEditor, listStyle: string) => {
    return editor.editable?.hasListStyle(listStyle)
  }
  static isCollapsedSelection = (editor: PortableTextEditor) =>
    editor.editable?.isCollapsedSelection()
  static isExpandedSelection = (editor: PortableTextEditor) =>
    editor.editable?.isExpandedSelection()
  static isMarkActive = (editor: PortableTextEditor, mark: string) =>
    editor.editable?.isMarkActive(mark)
  static insertChild = (
    editor: PortableTextEditor,
    type: Type,
    value?: {[prop: string]: unknown}
  ): Path | undefined => {
    debug(`Host inserting child`)
    return editor.editable?.insertChild(type, value)
  }
  static insertBlock = (
    editor: PortableTextEditor,
    type: Type,
    value?: {[prop: string]: unknown}
  ): Path | undefined => {
    return editor.editable?.insertBlock(type, value)
  }
  static isVoid = (editor: PortableTextEditor, element: PortableTextBlock | PortableTextChild) => {
    return editor.editable?.isVoid(element)
  }
  static isObjectPath = (editor: PortableTextEditor, path: Path): boolean => {
    if (!path || !Array.isArray(path)) return false
    const isChildObjectEditPath = path.length > 3 && path[1] === 'children'
    const isBlockObjectEditPath = path.length > 1 && path[1] !== 'children'
    return isBlockObjectEditPath || isChildObjectEditPath
  }
  static marks = (editor: PortableTextEditor) => {
    return editor.editable?.marks()
  }
  static select = (editor: PortableTextEditor, selection: EditorSelection | null) => {
    debug(`Host setting selection`, selection)
    editor.editable?.select(selection)
  }
  static removeAnnotation = (editor: PortableTextEditor, type: Type) =>
    editor.editable?.removeAnnotation(type)
  static toggleBlockStyle = (editor: PortableTextEditor, blockStyle: string) => {
    debug(`Host is toggling block style`)
    return editor.editable?.toggleBlockStyle(blockStyle)
  }
  static toggleList = (editor: PortableTextEditor, listStyle: string): void => {
    return editor.editable?.toggleList(listStyle)
  }
  static toggleMark = (editor: PortableTextEditor, mark: string): void => {
    debug(`Host toggling mark`, mark)
    editor.editable?.toggleMark(mark)
  }
}

const retrySync = throttle((syncFn, callbackFn) => syncFn(callbackFn), 100)

function bufferUntil<T>(emitWhen: (currentBuffer: T[]) => boolean): OperatorFunction<T, T[]> {
  return (source: Observable<T>) =>
    defer(() => {
      let buffer: T[] = [] // custom buffer
      return source.pipe(
        tap((v) => buffer.push(v)), // add values to buffer
        switchMap(() => (emitWhen(buffer) ? of(buffer) : EMPTY)), // emit the buffer when the condition is met
        tap(() => (buffer = [])) // clear the buffer
      )
    })
}

const NOOP = () => undefined
