import React from 'react'
import {
  PortableTextEditor,
  PortableTextBlock,
  PortableTextChild,
  EditorSelection,
  Type,
  EditorChange,
  Patch as EditorPatch,
  InvalidValue as InvalidEditorValue,
  HotkeyOptions,
  RenderAttributes
} from '@sanity/portable-text-editor'
import Button from 'part:@sanity/components/buttons/default'
import FormField from 'part:@sanity/components/formfields/default'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import InvalidValue from './InvalidValue'
import {Portal} from 'part:@sanity/components/utilities/portal'
import StackedEscapeable from 'part:@sanity/components/utilities/stacked-escapable'
import PatchEvent from '../../PatchEvent'
import {Marker} from '../../typedefs'
import {Patch} from '../../typedefs/patch'
import styles from './PortableTextInput.css'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {Subject} from 'rxjs'
import Toolbar from './Toolbar/Toolbar'
import {BlockObject} from './Objects/BlockObject'
import {Path} from '../../typedefs/path'
import {InlineObject} from './Objects/InlineObject'
import {startsWith} from '@sanity/util/paths'
import {EditObject} from './Objects/EditObject'
import {Annotation} from './Objects/Annotation'

export const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

type Props = {
  type: Type
  level: number
  value: PortableTextBlock[]
  readOnly: boolean | null
  onChange: (arg0: PatchEvent) => void
  onFocus: (Path) => void
  onBlur: () => void
  markers: Array<Marker>
  focusPath: Path
  onPaste?: (arg0: {
    event: React.SyntheticEvent
    path: []
    type: Type
    value: PortableTextBlock[] | undefined
  }) => {
    insert?: PortableTextBlock[]
    path?: []
  }
  subscribe: (arg0: ({patches: PatchEvent}) => void) => void
}

type State = {
  isFullscreen: boolean
  hasFocus: boolean
  invalidValue: InvalidEditorValue | null
  isActive: boolean
  isLoading: boolean
  selection: EditorSelection
  valueWithError: PortableTextBlock[] | undefined
  objectEditStatus: {editorPath: Path; formBuilderPath: Path; type: string} | null
}

type PatchWithOrigin = Patch & {
  origin: 'local' | 'remote' | 'internal'
  timestamp: Date
}

export default withPatchSubscriber(
  class PortableTextInput extends React.PureComponent<Props, State> {
    private editor: React.RefObject<PortableTextEditor> = React.createRef()
    private incoming: PatchWithOrigin[] = []
    private patche$: Subject<EditorPatch> = new Subject()
    private usubscribe: any

    handleToggleFullscreen = (): void => {
      const {isFullscreen, selection} = this.state
      const currentSelection = selection
      this.setState({isFullscreen: !isFullscreen})
      // The renderEditor fn will be redraw the DOM at this point, init the editor on the next tick to ensure we have something to focus on.
      setTimeout(() => {
        PortableTextEditor.select(this.editor.current, currentSelection)
        this.focus()
        this.highlightCursor()
      }, 100)
    }

    private hotkeys: HotkeyOptions = {
      marks: {
        'mod+b': 'strong',
        'mod+i': 'em',
        'mod+´': 'code'
      },
      custom: {
        'mod+enter': this.handleToggleFullscreen
      }
    }
    state = {
      hasFocus: false,
      invalidValue: null,
      isActive: false,
      isFullscreen: false,
      isLoading: false,
      objectEditStatus: null,
      selection: null,
      valueWithError: undefined
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): {} | null {
      let state = {}
      // Reset invalidValue state if new value is coming in from props
      if (nextProps.value !== (prevState.invalidValue && prevState.invalidValue.value)) {
        state = {...state, invalidValue: null}
      }
      // Figure out if the current focusPath is editing something that isn't text.
      // Set object edit path if so, or nullify the object edit path.
      // This will open the editing interfaces.
      const {focusPath} = nextProps
      if (focusPath) {
        const isChild = focusPath[1] === 'children'
        const isMarkdef = focusPath[1] === 'markDefs'
        const blockSegment = focusPath[0]
        if (isMarkdef && blockSegment && typeof blockSegment === 'object') {
          const block = nextProps.value.find(blk => blk._key === blockSegment._key)
          const markDefSegment = focusPath[2]
          if (block && markDefSegment && typeof markDefSegment === 'object') {
            const span = block.children.find(
              child => Array.isArray(child.marks) && child.marks.includes(markDefSegment._key)
            )
            if (span) {
              const spanPath = [blockSegment, 'children', {_key: span._key}]
              state = {
                ...state,
                objectEditStatus: {
                  editorPath: spanPath,
                  formBuilderPath: focusPath.slice(0, 3),
                  type: 'annotation'
                }
              }
            }
          }
        } else if (
          focusPath &&
          ((isChild && focusPath.length > 3) || (!isChild && focusPath.length > 1))
        ) {
          let type = 'blockObject'
          let path = focusPath.slice(0, 1)
          if (isChild) {
            type = 'inlineObject'
            path = path.concat(focusPath.slice(1, 3))
          }
          state = {
            ...state,
            objectEditStatus: {editorPath: path, formBuilderPath: path, type}
          }
        }
      }
      return Object.keys(state).length === 0 ? null : state
    }

    constructor(props: Props) {
      super(props)
      this.usubscribe = props.subscribe(this.handleDocumentPatches)
    }

    componentWillUnmount(): void {
      this.usubscribe()
    }

    private handleDocumentPatches = ({
      patches
    }: {
      patches: PatchWithOrigin[]
      snapshot: PortableTextBlock[] | undefined
    }): void => {
      const patchSelection =
        patches && patches.length > 0 && patches.filter(patch => patch.origin !== 'local')
      if (patchSelection) {
        this.incoming = this.incoming.concat(patchSelection)
        patchSelection.map(patch => this.patche$.next(patch))
      }
    }

    private handleEditorChange = (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          // Don't wait for the form-builder to do it's thing, we live in the
          // local state for now. The final value will be updated through props afterwards.
          setTimeout(() => {
            this.props.onChange(PatchEvent.from(change.patches))
          })
          break
        case 'focus':
          this.setState({hasFocus: true})
          break
        case 'blur':
          this.setState({hasFocus: false})
          break
        case 'loading':
          this.setState({isLoading: change.isLoading})
          break
        case 'undo':
        case 'redo':
          this.props.onChange(PatchEvent.from(change.patches))
          break
        case 'invalidValue':
          this.setState({invalidValue: change})
          break
        case 'selection':
          this.setState({selection: change.selection})
          if (change.selection) {
            this.props.onFocus(change.selection.focus.path)
          }
          break
        case 'ready':
        case 'patch':
        case 'value':
        case 'unset':
          break
        default:
          throw new Error(`Unhandled editor change ${JSON.stringify(change)}`)
      }
    }

    focus = (): void => {
      PortableTextEditor.focus(this.editor.current)
    }

    blur = (): void => {
      PortableTextEditor.blur(this.editor.current)
    }

    handleActivate = (): void => {
      this.setState({isActive: true})
      this.focus()
    }

    handleFormBuilderEditObjectChange = (patchEvent: PatchEvent, path: Path): void => {
      let _patchEvent = patchEvent
      path
        .slice(0)
        .reverse()
        .forEach(segment => {
          _patchEvent = _patchEvent.prefixAll(segment)
        })
      this.props.onChange(_patchEvent)
    }

    handleEditObjectFormBuilderFocus = (nextPath: Path): void => {
      if (this.state.objectEditStatus) {
        if (startsWith(this.state.objectEditStatus.formBuilderPath, this.props.focusPath)) {
          this.props.onFocus(nextPath)
          return
        }
      }
    }

    handleEditObjectFormBuilderBlur = (): void => {
      const {focusPath} = this.props
      if (focusPath && focusPath[1] !== 'markDefs') {
        PortableTextEditor.select(this.editor.current, {
          anchor: {path: focusPath, offset: 0},
          focus: {path: focusPath, offset: 0}
        })
      }
    }

    renderBlock = (
      value: PortableTextBlock,
      type: Type,
      ref: React.RefObject<HTMLDivElement>,
      attributes: RenderAttributes,
      defaultRender: (value: PortableTextBlock) => JSX.Element
    ): JSX.Element => {
      if (!this.editor.current) {
        return null
      }

      if (
        value._type ===
        PortableTextEditor.getPortableTextFeatures(this.editor.current).types.block.name
      ) {
        return defaultRender(value)
      }

      return (
        <BlockObject
          attributes={attributes}
          focusPath={this.props.focusPath}
          markers={this.props.markers}
          onChange={this.handleFormBuilderEditObjectChange}
          onFocus={this.props.onFocus}
          readOnly={this.props.readOnly}
          type={type}
          value={value}
        />
      )
    }

    renderChild = (
      value: PortableTextChild,
      type: Type,
      ref: React.RefObject<HTMLSpanElement>,
      attributes: RenderAttributes,
      defaultRender: (value: PortableTextChild) => JSX.Element
    ): JSX.Element => {
      const {focusPath, markers, readOnly} = this.props
      if (!this.editor.current) {
        return null
      }
      const isSpan =
        value._type ===
        PortableTextEditor.getPortableTextFeatures(this.editor.current).types.span.name
      const {annotations} = attributes
      const hasAnnotations = annotations && annotations.length > 0

      if (isSpan) {
        return defaultRender(value)
      }
      if (hasAnnotations) {
        const annotation = annotations[0]
        return (
          <Annotation
            key={annotation._key}
            attributes={attributes}
            focusPath={focusPath}
            markers={markers}
            onFocus={this.props.onFocus}
            onChange={this.handleFormBuilderEditObjectChange}
            readOnly={readOnly}
            type={type}
            value={annotation}
          >
            {defaultRender(value)}
          </Annotation>
        )
      }
      return (
        <InlineObject
          attributes={attributes}
          focusPath={focusPath}
          markers={markers}
          onFocus={this.props.onFocus}
          onChange={this.handleFormBuilderEditObjectChange}
          readOnly={readOnly}
          type={type}
          value={value}
        />
      )
    }

    // TODO: Highlight the cursor to better show where you are at when toggling fullscreen
    highlightCursor = () => {
      // console.log('Hightlight cursor')
    }

    renderEditor = (editor: JSX.Element): JSX.Element => {
      const {selection, isFullscreen} = this.state
      const {onFocus, markers} = this.props

      const scClassNames = [
        styles.scrollContainer,
        ...(isFullscreen ? [styles.fullscreen] : [])
      ].join(' ')
      const editorWrapperClassNames = [
        styles.editorWrapper,
        ...(isFullscreen ? [styles.fullscreen] : [])
      ].join(' ')

      const editorClassNames = [styles.editor, ...(isFullscreen ? [styles.fullscreen] : [])].join(
        ' '
      )

      const toolbar = (
        <Toolbar
          editor={this.editor.current}
          isFullscreen={isFullscreen}
          markers={markers}
          onFocus={onFocus}
          onToggleFullscreen={this.handleToggleFullscreen}
          selection={selection}
        />
      )

      const wrappedEditor = (
        <div>
          {toolbar}
          <div className={scClassNames}>
            <div className={editorWrapperClassNames}>
              <div className={editorClassNames}>{editor}</div>
            </div>
          </div>
        </div>
      )

      // TODO: could this be rendered the same way DOM-wize?
      if (isFullscreen) {
        return (
          <Portal>
            <StackedEscapeable onEscape={this.handleToggleFullscreen}>
              <div className={styles.fullscreenWrapper}>{wrappedEditor}</div>
            </StackedEscapeable>
          </Portal>
        )
      }
      return wrappedEditor
    }

    renderEditObject = (): JSX.Element => {
      const {objectEditStatus} = this.state
      const [node] = PortableTextEditor.findByPath(this.editor.current, objectEditStatus.editorPath)
      if (node) {
        let object = node
        const ptFeatures = PortableTextEditor.getPortableTextFeatures(this.editor.current)
        let lookForType = node._type
        // If it's an annotation get the object from the block.markDefs
        if (objectEditStatus.type === 'annotation') {
          const [block] = PortableTextEditor.findByPath(
            this.editor.current,
            objectEditStatus.editorPath.slice(0, 1)
          )
          if (block) {
            const markDef = block['markDefs'].find(def => object.marks.includes(def._key))
            if (markDef) {
              lookForType = markDef._type
              object = markDef
            }
          }
        }
        // Find the type
        const type = ptFeatures.types[
          objectEditStatus.formBuilderPath.length === 1
            ? 'blockObjects'
            : objectEditStatus.type === 'annotation'
            ? 'annotations'
            : 'inlineObjects'
        ].find(t => t.name === lookForType)

        // eslint-disable-next-line react/no-find-dom-node
        const referenceElement = PortableTextEditor.findDOMNode(this.editor.current, node)

        const handleClose = (): void => {
          const {editorPath} = objectEditStatus
          const {onFocus} = this.props
          onFocus([])
          this.setState({objectEditStatus: null})
          PortableTextEditor.select(this.editor.current, {
            focus: {path: editorPath, offset: 0},
            anchor: {path: editorPath, offset: 0}
          })
        }

        return (
          <EditObject
            formBuilderPath={objectEditStatus.formBuilderPath}
            focusPath={this.props.focusPath}
            markers={this.props.markers} // TODO: filter relevant
            editorPath={objectEditStatus.editorPath}
            object={object}
            onBlur={this.handleEditObjectFormBuilderBlur}
            onChange={this.handleFormBuilderEditObjectChange}
            onClose={handleClose}
            onFocus={this.handleEditObjectFormBuilderFocus}
            readOnly={this.props.readOnly}
            referenceElement={referenceElement}
            type={type}
          />
        )
      }
      return null
    }

    render(): JSX.Element {
      const {value, readOnly, type, markers, level, onFocus, onBlur} = this.props
      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      const {isLoading, hasFocus, invalidValue, objectEditStatus} = this.state
      if (invalidValue) {
        return (
          <InvalidValue
            onChange={this.handleEditorChange}
            resolution={invalidValue.resolution}
            value={value}
          />
        )
      }

      return (
        <div className={[styles.root, ...(hasFocus ? [styles.focus] : [])].join(' ')}>
          <FormField
            markers={markers}
            level={level}
            label={type.title}
            description={type.description}
          />
          <ActivateOnFocus
            isActive={this.state.isActive}
            html={
              <div className={styles.activeOnFocus}>
                <h3>Click to edit</h3>
                <div>or</div>
                <div>
                  <Button onClick={this.handleToggleFullscreen} color="primary">
                    Open in fullscreen
                  </Button>
                </div>
                <p className={styles.keyboardShortcut}>
                  Tip: <br />
                  <strong>
                    {IS_MAC ? '⌘' : 'ctrl'}
                    &nbsp;+&nbsp;enter
                  </strong>{' '}
                  while editing to go in fullscreen
                </p>
              </div>
            }
            onActivate={this.handleActivate}
          >
            {/* <button
              type="button"
              onClick={() =>
                this.props.onFocus([
                  {_key: 'fdc63fdab41d'},
                  'markDefs',
                  {_key: 'b96ee1f520be'},
                  FOCUS_TERMINATOR
                ])
              }
            >
              Test focuspath
            </button> */}
            <PortableTextEditor
              hotkeys={this.hotkeys}
              maxBlocks={-1} // TODO: from schema?
              onChange={this.handleEditorChange}
              incomingPatche$={this.patche$.asObservable()}
              placeholderText={value ? undefined : '[No content]'}
              readOnly={readOnly}
              ref={this.editor}
              renderBlock={this.renderBlock}
              renderChild={this.renderChild}
              renderEditor={this.renderEditor}
              spellCheck={false} // TODO: from schema?
              type={type}
              value={value}
            />
          </ActivateOnFocus>
          {objectEditStatus && this.renderEditObject()}
        </div>
      )
    }
  }
)
