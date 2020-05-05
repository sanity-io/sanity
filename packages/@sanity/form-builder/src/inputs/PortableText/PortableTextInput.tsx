import React from 'react'
import {
  PortableTextEditor,
  PortableTextBlock,
  PortableTextChild,
  EditorSelection,
  Type,
  keyGenerator,
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
import {interval, Subject} from 'rxjs'
import {map, take} from 'rxjs/operators'
import Toolbar from './Toolbar/Toolbar'
import {BlockObject} from './Objects/BlockObject'
import {Path} from '../../typedefs/path'
import {InlineObject} from './Objects/InlineObject'
import {startsWith} from '@sanity/util/paths'
import {EditObject} from './Objects/EditObject'

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
  objectEditPath: Path | null
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
    private interval: any

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
        'ctrl+alt+p': this.handleToggleFullscreen
      }
    }
    state = {
      hasFocus: false,
      invalidValue: null,
      isActive: false,
      isFullscreen: false,
      isLoading: false,
      objectEditPath: null,
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
      // Set object edit path if so, or nullify the object edit path
      const {focusPath} = nextProps
      if (focusPath) {
        const isChild = focusPath[1] === 'children'
        if (
          focusPath &&
          ((isChild && focusPath.length > 3) || (!isChild && focusPath.length > 1))
        ) {
          let objectEditPath = focusPath.slice(0, 1)
          if (isChild) {
            objectEditPath = objectEditPath.concat(focusPath.slice(1, -1))
          }
          state = {...state, objectEditPath}
        } else {
          state = {...state, objectEditPath: null}
        }
      }
      return Object.keys(state).length === 0 ? null : state
    }

    constructor(props: Props) {
      super(props)
      this.usubscribe = props.subscribe(this.handleDocumentPatches)
      // TODO: remove this when finished testing
      if (document.location.hash === '#test') {
        this.interval = interval(2000)
          .pipe(take(100))
          .pipe(
            map(
              (): Patch => ({
                type: 'diffMatchPatch',
                path: [0, 'children', 0, 'text'],
                value: `@@ -0,0 +1 @@\n+${keyGenerator().substring(0, 1)}\n`,
                origin: 'remote'
              })
            )
          )
          .subscribe(patch => {
            props.onChange(PatchEvent.from([patch]))
          })
      }
    }

    componentWillUnmount(): void {
      this.usubscribe()
      // TODO: remove this when finished testing
      if (this.interval) {
        this.interval.unsubscribe()
      }
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

    private handleChange = (change: EditorChange): void => {
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

    handleFormBuilderChange = (patchEvent: PatchEvent, path: Path): void => {
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
      if (this.state.objectEditPath) {
        if (startsWith(this.state.objectEditPath, this.props.focusPath)) {
          this.props.onFocus(nextPath)
          return
        }
      }
    }

    handleEditObjectFormBuilderBlur = (): void => {
      const {focusPath} = this.props
      PortableTextEditor.select(this.editor.current, {
        anchor: {path: focusPath, offset: 0},
        focus: {path: focusPath, offset: 0}
      })
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
          onChange={this.handleFormBuilderChange}
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
      attributes: {
        focused: boolean
        selected: boolean
        path: Path
      },
      defaultRender: (value: PortableTextChild) => JSX.Element
    ): JSX.Element => {
      const {focusPath, markers, readOnly} = this.props
      if (!this.editor.current) {
        return null
      }
      const isSpan =
        value._type ===
        PortableTextEditor.getPortableTextFeatures(this.editor.current).types.span.name

      if (isSpan) {
        return defaultRender(value)
      }
      return (
        <InlineObject
          attributes={attributes}
          focusPath={focusPath}
          markers={markers}
          onFocus={this.props.onFocus}
          onChange={this.handleFormBuilderChange}
          readOnly={readOnly}
          type={type}
          value={value}
        />
      )
    }

    // Highlight the cursor
    highlightCursor = () => {
      console.log('Hightlight cursor')
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

    renderEditObject = () => {
      const {objectEditPath} = this.state
      const [object] = PortableTextEditor.findByPath(this.editor.current, objectEditPath)
      if (object) {
        const type = PortableTextEditor.getPortableTextFeatures(this.editor.current).types[
          objectEditPath.length === 1 ? 'blockObjects' : 'inlineObjects'
        ].find(t => t.name === object._type)
        //const referenceElement = PortableTextEditor.findDOMNode(this.editor.current, object)
        const handleClose = () => {
          this.props.onFocus(objectEditPath)
        }
        return (
          <EditObject
            object={object}
            type={type}
            path={objectEditPath}
            referenceElement={null}
            readOnly={this.props.readOnly}
            markers={this.props.markers}
            focusPath={this.props.focusPath}
            onFocus={this.handleEditObjectFormBuilderFocus}
            onBlur={this.handleEditObjectFormBuilderBlur}
            onClose={handleClose}
            onChange={this.handleFormBuilderChange}
          />
        )
      }
      return null
    }

    render(): JSX.Element {
      const {value, readOnly, type, markers, level, onFocus, onBlur} = this.props
      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      const {isLoading, hasFocus, invalidValue, objectEditPath} = this.state
      if (invalidValue) {
        return (
          <InvalidValue
            onChange={this.handleChange}
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
                  {_key: '880e222c24c6'},
                  'children',
                  {_key: 'c1c72256843e'},
                  'mystring'
                ])
              }
            >
              Test focuspath
            </button> */}
            <PortableTextEditor
              hotkeys={this.hotkeys}
              maxBlocks={-1} // TODO: from schema?
              onChange={this.handleChange}
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
          {this.state.objectEditPath && this.renderEditObject()}
        </div>
      )
    }
  }
)
