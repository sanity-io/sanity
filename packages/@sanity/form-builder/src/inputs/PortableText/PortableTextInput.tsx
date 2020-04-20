import React from 'react'
import {
  PortableTextEditor,
  PortableTextBlock,
  PortableTextChild,
  EditorSelection,
  Type,
  EditorChange,
  Patch as EditorPatch,
  InvalidValue as InvalidEditorValue
} from '@sanity/portable-text-editor'
import FormField from 'part:@sanity/components/formfields/default'
import InvalidValue from './InvalidValue'
import PatchEvent from '../../PatchEvent'
import {Marker} from '../../typedefs'
import {Patch} from '../../typedefs/patch'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {interval, Subject} from 'rxjs'
// import {map, take} from 'rxjs/operators'

type Props = {
  type: Type
  level: number
  value: PortableTextBlock[]
  readOnly: boolean | null
  onChange: (arg0: PatchEvent) => void
  onFocus: () => void
  onBlur: () => void
  markers: Array<Marker>
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
  selection: EditorSelection
  isLoading: boolean
  invalidValue: InvalidEditorValue | null
  valueWithError: PortableTextBlock[] | undefined
}

type PatchWithOrigin = Patch & {
  origin: 'local' | 'remote' | 'internal'
  timestamp: Date
}

export default withPatchSubscriber(
  class PortableTextInput extends React.PureComponent<Props, State> {
    private editor: PortableTextEditor | null
    private incoming: PatchWithOrigin[] = []
    private patche$: Subject<EditorPatch> = new Subject()
    private usubscribe: any
    private interval: any
    private hotkeys = {
      marks: {
        'mod+b': 'strong',
        'mod+i': 'em',
        'mod+´': 'code'
      }
    }
    state = {
      selection: null,
      isLoading: false,
      invalidValue: null,
      valueWithError: undefined
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): {} | null {
      if (nextProps.value !== prevState.valueWithError && prevState.invalidValue) {
        return {invalidValue: null}
      }
      return null
    }

    constructor(props: Props) {
      super(props)
      this.usubscribe = props.subscribe(this.handleDocumentPatches)
      this.interval = interval(2000)
      //   .pipe(take(100))
      //   .pipe(
      //     map(
      //       (): Patch => ({
      //         type: 'diffMatchPatch',
      //         path: [0, 'children', 0, 'text'],
      //         value: `@@ -0,0 +1 @@\n+${keyGenerator().substring(0, 1)}\n`,
      //         origin: 'remote'
      //       })
      //     )
      //   )
      //   .subscribe(patch => {
      //     props.onChange(PatchEvent.from([patch]))
      //   })
    }

    componentWillUnmount(): void {
      this.usubscribe()
    }

    private setEditor = (editor: PortableTextEditor | null): void => {
      this.editor = editor
    }

    private handleDocumentPatches = ({
      patches
    }: {
      patches: PatchWithOrigin[]
      snapshot: PortableTextBlock[] | undefined
    }): void => {
      const selection =
        patches && patches.length > 0 && patches.filter(patch => patch.origin !== 'local')
      if (selection) {
        this.incoming = this.incoming.concat(selection)
        selection.map(patch => this.patche$.next(patch))
      }
    }

    private handleChange = (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          this.props.onChange(PatchEvent.from(change.patches))
          break
        case 'selection':
          this.setState({selection: change.selection})
          break
        case 'focus':
          this.props.onFocus && this.props.onFocus()
        case 'blur':
          this.props.onBlur && this.props.onBlur()
          break
        case 'loading':
          this.setState({isLoading: change.isLoading})
          break
        case 'undo':
        case 'redo':
          this.props.onChange(PatchEvent.from(change.patches))
          break
        case 'invalidValue':
          this.setState({invalidValue: change, valueWithError: this.props.value})
          break
        case 'patch':
        case 'value':
        case 'unset':
          break
        default:
          throw new Error(`Unhandled editor change ${JSON.stringify(change)}`)
      }
    }

    focus(): void {
      if (this.editor) {
        this.editor.focus()
      }
    }

    renderBlock = (
      block: PortableTextBlock,
      attributes: {focused: boolean; selected: boolean}
    ): JSX.Element => {
      if (!this.editor) {
        return null
      }
      // Offload rendering text to the editor
      if (block._type === this.editor.getPortableTextFeatures().types.block.name) {
        return undefined
      }
      // Render object blocks (images, etc)
      return (
        <div
          style={{color: '#999', fontFamily: 'monospace', padding: '1em', backgroundColor: '#eee'}}
        >
          {JSON.stringify(block)} {JSON.stringify(attributes)}
        </div>
      )
    }

    renderChild = (child: PortableTextChild): JSX.Element => {
      if (!this.editor) {
        return null
      }
      // Offload rendering text to the editor
      if (child._type === this.editor.getPortableTextFeatures().types.span.name) {
        return undefined
      }
      // Render object childs (images, etc)
      return (
        <span style={{fontFamily: 'monospace', padding: '1em', backgroundColor: '#eee'}}>
          {JSON.stringify(child)}
        </span>
      )
    }

    render(): React.ReactNode {
      const {value, readOnly, type, markers, level, onFocus, onBlur} = this.props
      const validation = markers.filter(marker => marker.type === 'validation')
      const errors = validation.filter(marker => marker.level === 'error')
      const {isLoading, selection, invalidValue} = this.state
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
        <FormField
          markers={markers}
          level={level}
          label={type.title}
          description={type.description}
        >
          <div style={{overflowY: 'auto', maxHeight: '300px', overflowX: 'hidden'}}>
            <PortableTextEditor
              hotkeys={this.hotkeys}
              maxBlocks={-1} // TODO: from schema
              onChange={this.handleChange}
              incomingPatche$={this.patche$.asObservable()}
              placeholderText={value ? '' : '[No value]'}
              readOnly={readOnly}
              ref={this.setEditor}
              renderBlock={this.renderBlock}
              renderChild={this.renderChild}
              searchAndReplace
              selection={selection}
              spellCheck={false}
              type={type}
              value={value}
            />
          </div>
        </FormField>
      )
    }
  }
)
