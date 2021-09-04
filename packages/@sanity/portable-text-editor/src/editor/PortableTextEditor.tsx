import React from 'react'
import {Path} from '@sanity/types'
import {Subscription, Subject} from 'rxjs'
import {distinctUntilChanged} from 'rxjs/operators'
import {randomKey} from '@sanity/util/content'
import {compileType} from '../utils/schema'
import {getPortableTextFeatures} from '../utils/getPortableTextFeatures'
import {PortableTextBlock, PortableTextFeatures, PortableTextChild} from '../types/portableText'
import {Type, RawType as RawSchemaType, PortableTextType} from '../types/schema'
import type {Patch} from '../types/patch'
import {
  EditorSelection,
  EditorChange,
  EditorChanges,
  EditableAPI,
  InvalidValueResolution,
  PatchObservable,
} from '../types/editor'
import {compactPatches} from '../utils/patches'
import {validateValue} from '../utils/validateValue'
import {debugWithName} from '../utils/debug'
import {PortableTextEditorContext} from './hooks/usePortableTextEditor'
import {PortableTextEditorSelectionContext} from './hooks/usePortableTextEditorSelection'
import {PortableTextEditorValueContext} from './hooks/usePortableTextEditorValue'

export const defaultKeyGenerator = () => randomKey(12)

const debug = debugWithName('component:PortableTextEditor')

type Props = {
  keyGenerator?: () => string
  maxBlocks?: number | string
  onChange: (change: EditorChange) => void
  incomingPatches$?: PatchObservable
  readOnly?: boolean
  selection?: EditorSelection
  type: Type | RawSchemaType
  value: PortableTextBlock[] | undefined
}

type State = {
  invalidValueResolution: InvalidValueResolution
  selection: EditorSelection
}

// The PT editor's public API
export class PortableTextEditor extends React.Component<Props, State> {
  static activeAnnotations = (editor: PortableTextEditor): PortableTextBlock[] => {
    return editor && editor.editable ? editor.editable.activeAnnotations() : []
  }
  static addAnnotation = (
    editor: PortableTextEditor,
    type: Type,
    value?: {[prop: string]: any}
  ): {spanPath: Path; markDefPath: Path} | undefined => editor.editable?.addAnnotation(type, value)
  static blur = (editor: PortableTextEditor): void => {
    debug('Host blurred')
    editor.editable?.blur()
  }
  static delete = (
    editor: PortableTextEditor,
    selection: EditorSelection,
    options?: {mode?: 'block' | 'children'}
  ) => editor.editable?.delete(selection, options)
  static findDOMNode = (
    editor: PortableTextEditor,
    element: PortableTextBlock | PortableTextChild
  ) => {
    return editor.editable?.findDOMNode(element)
  }
  static findByPath = (editor: PortableTextEditor, path: Path) => {
    return editor.editable?.findByPath(path)
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
    return editor.editable?.getSelection()
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
    value?: {[prop: string]: any}
  ): Path | undefined => {
    debug(`Host inserting child`)
    return editor.editable?.insertChild(type, value)
  }
  static insertBlock = (
    editor: PortableTextEditor,
    type: Type,
    value?: {[prop: string]: any}
  ): Path | undefined => {
    return editor.editable?.insertBlock(type, value)
  }
  static isVoid = (editor: PortableTextEditor, element: PortableTextBlock | PortableTextChild) => {
    return editor.editable?.isVoid(element)
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

  private changeSubscription: Subscription
  private pendingPatches: Patch[] = []

  public type: PortableTextType
  public portableTextFeatures: PortableTextFeatures
  public change$: EditorChanges = new Subject()
  public isThrottling = false
  public editable?: EditableAPI
  public keyGenerator: () => string
  public maxBlocks: number | undefined
  public readOnly: boolean
  public incomingPatches$?: PatchObservable

  constructor(props: Props) {
    super(props)
    // Test if we have a compiled schema type, if not, conveniently compile it
    this.type = props.type.hasOwnProperty('jsonType') ? props.type : compileType(props.type)
    // Indicate that we are loading
    this.change$.next({type: 'loading', isLoading: true})

    // Get the block types feature set (lookup table)
    this.portableTextFeatures = getPortableTextFeatures(this.type)

    // Subscribe to (distinct) changes
    this.changeSubscription = this.change$
      .pipe(distinctUntilChanged())
      .subscribe(this.onEditorChange)

    // Setup keyGenerator (either from props, or default)
    this.keyGenerator = props.keyGenerator || defaultKeyGenerator

    // Validate the Portable Text value
    let state: State = {selection: null, invalidValueResolution: null}
    const validation = validateValue(props.value, this.portableTextFeatures, this.keyGenerator)
    if (props.value && !validation.valid) {
      this.change$.next({type: 'loading', isLoading: false})
      this.change$.next({
        type: 'invalidValue',
        resolution: validation.resolution,
        value: props.value,
      })
      state = {...state, invalidValueResolution: validation.resolution}
    }
    this.incomingPatches$ = props.incomingPatches$
    this.maxBlocks =
      typeof props.maxBlocks === 'undefined'
        ? undefined
        : parseInt(props.maxBlocks.toString(), 10) || undefined
    this.readOnly = props.readOnly || false
    this.state = state
  }

  componentWillUnmount() {
    this.flush()
    this.changeSubscription.unsubscribe()
  }

  componentDidUpdate(prevProps: Props) {
    this.readOnly = this.props.readOnly || false
    // Validate again if value length has changed
    if (this.props.value && (prevProps.value || []).length !== this.props.value.length) {
      debug('Validating')
      const validation = validateValue(
        this.props.value,
        this.portableTextFeatures,
        this.keyGenerator
      )
      if (this.props.value && !validation.valid) {
        this.change$.next({
          type: 'invalidValue',
          resolution: validation.resolution,
          value: this.props.value,
        })
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({invalidValueResolution: validation.resolution})
      }
    }
  }

  public setEditable = (editable: EditableAPI) => {
    this.editable = {...this.editable, ...editable}
    this.change$.next({type: 'ready'})
  }
  private flush = () => {
    const {onChange} = this.props
    const finalPatches = compactPatches(this.pendingPatches)
    if (finalPatches.length > 0) {
      onChange({type: 'mutation', patches: finalPatches})
    }
    this.pendingPatches = []
  }

  private onEditorChange = (next: EditorChange): void => {
    const {onChange} = this.props
    switch (next.type) {
      case 'mutation':
        if (this.isThrottling) {
          this.pendingPatches = [...this.pendingPatches, ...next.patches]
        } else {
          this.flush()
        }
        break
      case 'throttle':
        if (next.throttle !== this.isThrottling) {
          onChange(next)
        }
        if (next.throttle) {
          this.isThrottling = true
        } else {
          this.isThrottling = false
          if (this.pendingPatches.length > 0) {
            this.flush()
          }
        }
        break
      case 'selection':
        this.setState({selection: next.selection})
        onChange(next)
        break
      case 'undo':
      case 'redo':
        this.flush()
        onChange(next)
        break
      default:
        onChange(next)
    }
  }

  render() {
    if (this.state.invalidValueResolution) {
      return this.state.invalidValueResolution.description
    }
    return (
      <PortableTextEditorContext.Provider value={this}>
        <PortableTextEditorValueContext.Provider value={this.props.value}>
          <PortableTextEditorSelectionContext.Provider value={this.state.selection}>
            {this.props.children}
          </PortableTextEditorSelectionContext.Provider>
        </PortableTextEditorValueContext.Provider>
      </PortableTextEditorContext.Provider>
    )
  }
}
