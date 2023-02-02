import React, {PropsWithChildren, createRef} from 'react'
import {
  ArrayDefinition,
  ArraySchemaType,
  BlockSchemaType,
  ObjectSchemaType,
  Path,
  PortableTextBlock,
  PortableTextChild,
  PortableTextObject,
  SpanSchemaType,
} from '@sanity/types'
import {Subject} from 'rxjs'
import {compileType} from '../utils/schema'
import {getPortableTextMemberSchemaTypes} from '../utils/getPortableTextMemberSchemaTypes'
import {
  EditableAPI,
  EditableAPIDeleteOptions,
  EditorChange,
  EditorChanges,
  EditorSelection,
  PatchObservable,
  PortableTextMemberSchemaTypes,
} from '../types/editor'
import {debugWithName} from '../utils/debug'
import {defaultKeyGenerator} from './hooks/usePortableTextEditorKeyGenerator'
import {SlateContainer} from './components/SlateContainer'
import {Synchronizer} from './components/Synchronizer'
import {Validator} from './components/Validator'

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
export type PortableTextEditorProps = PropsWithChildren<{
  /**
   * Function that gets called when the editor changes the value
   */
  onChange: (change: EditorChange) => void

  /**
   * Schema type for the portable text field
   */
  schemaType: ArraySchemaType<PortableTextBlock> | ArrayDefinition

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
   * Observable of local and remote patches for the edited value.
   */
  patches$?: PatchObservable

  /**
   * Backward compatibility (renamed to patches$).
   */
  incomingPatches$?: PatchObservable
}>

/**
 * The main Portable Text Editor component.
 * @public
 */
export class PortableTextEditor extends React.Component<PortableTextEditorProps> {
  /**
   * An observable of all the editor changes.
   */
  public change$: EditorChanges = new Subject()
  /**
   * A lookup table for all the relevant schema types for this portable text type.
   */
  public schemaTypes: PortableTextMemberSchemaTypes
  /**
   * The editor API (currently implemented with Slate).
   */
  private editable?: EditableAPI
  /**
   * This reference tracks if we are in a pending local edit state. If local changes are unsettled (patches yet not submitted),
   * we use it to make sure we don't handle any new props.value or remote patches that can interfere with the user's typing.
   */
  private isPending: React.MutableRefObject<boolean | null>

  constructor(props: PortableTextEditorProps) {
    super(props)

    if (!props.schemaType) {
      throw new Error('PortableTextEditor: missing "type" property')
    }

    if (props.incomingPatches$) {
      console.warn(`The prop 'incomingPatches$' is deprecated and renamed to 'patches$'`)
    }

    this.change$.next({type: 'loading', isLoading: true})

    this.isPending = createRef()
    this.isPending.current = false

    this.schemaTypes = getPortableTextMemberSchemaTypes(
      props.schemaType.hasOwnProperty('jsonType') ? props.schemaType : compileType(props.schemaType)
    )
  }

  componentDidUpdate(prevProps: PortableTextEditorProps) {
    // Set up the schema type lookup table again if the source schema type changes
    if (this.props.schemaType !== prevProps.schemaType) {
      this.schemaTypes = getPortableTextMemberSchemaTypes(
        this.props.schemaType.hasOwnProperty('jsonType')
          ? this.props.schemaType
          : compileType(this.props.schemaType)
      )
    }
  }

  public setEditable = (editable: EditableAPI) => {
    this.editable = {...this.editable, ...editable}
    this.change$.next({type: 'loading', isLoading: false})
    this.change$.next({type: 'ready'})
    this.change$.next({type: 'value', value: this.props.value})
  }

  render() {
    const {onChange, value, children, patches$, incomingPatches$} = this.props
    const {change$, isPending} = this
    const _patches$ = incomingPatches$ || patches$ // Backward compatibility

    const maxBlocks =
      typeof this.props.maxBlocks === 'undefined'
        ? undefined
        : parseInt(this.props.maxBlocks.toString(), 10) || undefined

    const readOnly = Boolean(this.props.readOnly)
    const keyGenerator = this.props.keyGenerator || defaultKeyGenerator
    return (
      <Validator portableTextEditor={this} keyGenerator={keyGenerator} value={value}>
        <SlateContainer
          keyGenerator={keyGenerator}
          maxBlocks={maxBlocks}
          patches$={_patches$}
          portableTextEditor={this}
          readOnly={readOnly}
          value={value}
          isPending={isPending}
        >
          <Synchronizer
            change$={change$}
            editor={this}
            isPending={isPending}
            keyGenerator={keyGenerator}
            onChange={onChange}
            readOnly={readOnly}
            value={value}
          >
            {children}
          </Synchronizer>
        </SlateContainer>
      </Validator>
    )
  }

  // Static API methods
  static activeAnnotations = (editor: PortableTextEditor): PortableTextObject[] => {
    return editor && editor.editable ? editor.editable.activeAnnotations() : []
  }
  static addAnnotation = (
    editor: PortableTextEditor,
    type: ObjectSchemaType,
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
    type: SpanSchemaType | ObjectSchemaType,
    value?: {[prop: string]: unknown}
  ): Path | undefined => {
    debug(`Host inserting child`)
    return editor.editable?.insertChild(type, value)
  }
  static insertBlock = (
    editor: PortableTextEditor,
    type: BlockSchemaType | ObjectSchemaType,
    value?: {[prop: string]: unknown}
  ): Path | undefined => {
    return editor.editable?.insertBlock(type, value)
  }
  static insertBreak = (editor: PortableTextEditor): void => {
    return editor.editable?.insertBreak()
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
  static removeAnnotation = (editor: PortableTextEditor, type: ObjectSchemaType) =>
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
