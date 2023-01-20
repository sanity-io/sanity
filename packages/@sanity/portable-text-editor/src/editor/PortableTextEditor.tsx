import React, {PropsWithChildren} from 'react'
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
import {randomKey} from '@sanity/util/content'
import {compileType} from '../utils/schema'
import {getPortableTextMemberSchemaTypes} from '../utils/getPortableTextMemberSchemaTypes'
import {
  EditorSelection,
  EditorChange,
  EditorChanges,
  EditableAPI,
  InvalidValueResolution,
  PatchObservable,
  EditableAPIDeleteOptions,
  PortableTextMemberSchemaTypes,
} from '../types/editor'
import {validateValue} from '../utils/validateValue'
import {debugWithName} from '../utils/debug'
import {SlateContainer} from './SlateContainer'
import {Synchronizer} from './Synchronizer'

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
}>

/**
 * @internal
 */

export interface PortableTextEditorState {
  invalidValueResolution: InvalidValueResolution | null
}
export class PortableTextEditor extends React.Component<
  PortableTextEditorProps,
  PortableTextEditorState
> {
  public change$: EditorChanges = new Subject()
  public keyGenerator: () => string
  public maxBlocks: number | undefined
  public schemaTypes: PortableTextMemberSchemaTypes
  public type: ArraySchemaType<PortableTextBlock>

  private editable?: EditableAPI

  constructor(props: PortableTextEditorProps) {
    super(props)

    if (!props.schemaType) {
      throw new Error('PortableTextEditor: missing "type" property')
    }

    // Test if we have a compiled schema type, if not, conveniently compile it
    this.type = props.schemaType.hasOwnProperty('jsonType')
      ? props.schemaType
      : compileType(props.schemaType)
    // Indicate that we are loading
    this.change$.next({type: 'loading', isLoading: true})

    // Get the block types feature set (lookup table)
    this.schemaTypes = getPortableTextMemberSchemaTypes(this.type)

    // Setup keyGenerator (either from props, or default)
    this.keyGenerator = props.keyGenerator || defaultKeyGenerator

    this.state = {
      invalidValueResolution: null,
    }

    // Validate the incoming value
    if (props.value) {
      const validation = validateValue(props.value, this.schemaTypes, this.keyGenerator)
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
  }

  public setEditable = (editable: EditableAPI) => {
    this.editable = {...this.editable, ...editable}
    this.change$.next({type: 'ready'})
  }

  render() {
    if (this.state.invalidValueResolution) {
      return this.state.invalidValueResolution.description
    }

    const maxBlocks =
      typeof this.props.maxBlocks === 'undefined'
        ? undefined
        : parseInt(this.props.maxBlocks.toString(), 10) || undefined

    const readOnly = Boolean(this.props.readOnly)
    return (
      <SlateContainer
        editor={this}
        maxBlocks={maxBlocks}
        readOnly={readOnly}
        value={this.props.value}
      >
        <Synchronizer
          change$={this.change$}
          editor={this}
          patches$={this.props.patches$}
          onChange={this.props.onChange}
          readOnly={readOnly}
          value={this.props.value}
        >
          {this.props.children}
        </Synchronizer>
      </SlateContainer>
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
