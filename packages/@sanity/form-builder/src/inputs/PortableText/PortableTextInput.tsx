import React from 'react'
import {
  PortableTextEditor,
  PortableTextBlock,
  EditorSelection,
  Type,
  EditorChange,
  compactPatches
} from '@sanity/portable-text-editor'
import FormField from 'part:@sanity/components/formfields/default'
import PatchEvent, {set, unset} from '../../PatchEvent'
import {Marker} from '../../typedefs'
import {Subject, Subscription} from 'rxjs'
import {distinctUntilChanged} from 'rxjs/operators'

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
}

type State = {
  selection: EditorSelection
}

const HOTKEYS = {
  marks: {
    'mod+b': 'strong',
    'mod+i': 'em',
    'mod+´': 'code'
  }
}

export default class PortableTextInput extends React.PureComponent<Props, State> {
  private _editor: PortableTextEditor | null
  private _pendingPatches = []
  private _isThrottling = false
  private changes$: Subject<EditorChange> = new Subject()
  private changes: Subscription
  state = {
    selection: null
  }
  constructor(props: Props) {
    super(props)
    this.changes = this.changes$.pipe(distinctUntilChanged()).subscribe(this.handleChange)
  }

  private commit(): void {
    const cPatches = compactPatches(this._pendingPatches)
    this.props.onChange(PatchEvent.from(cPatches))
    this._pendingPatches = []
  }

  private setEditor = (editor: PortableTextEditor | null) => {
    this._editor = editor
  }

  componentWillUnmount() {
    this.changes$.unsubscribe()
  }

  handleChange = (next: EditorChange): void => {
    switch (next.type) {
      case 'mutation':
        if (!this._isThrottling) {
          this.commit()
        } else {
          this._pendingPatches = [...this._pendingPatches, ...next.patches]
        }
        break
      case 'selection':
        this.setState({selection: next.selection})
        break
      case 'throttle':
        if (next.throttle) {
          this._isThrottling = true
        } else {
          this._isThrottling = false
          // Commit pending patches (compacted)
          if (this._pendingPatches.length > 0) {
            this.commit()
          }
        }
        break
      default:
        throw new Error('Unhandled editor event')
    }
  }

  focus(): void {
    if (this._editor) {
      this._editor.focus()
    }
  }

  render() {
    const {value, readOnly, type, markers, level, onFocus, onBlur} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const {selection} = this.state
    return (
      <FormField markers={markers} level={level} label={type.title} description={type.description}>
        <div style={{overflowY: 'auto', maxHeight: '300px', overflowX: 'hidden'}}>
          <PortableTextEditor
            ref={this.setEditor}
            placeholderText=""
            type={type}
            changes={this.changes$}
            selection={selection}
            hotkeys={HOTKEYS}
            value={value}
            maxBlocks={-1} // TODO: from schema
            spellCheck={false}
            readOnly={readOnly}
          />
        </div>
      </FormField>
    )
  }
}
