/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-unassigned-import */
import React from 'react'
import {UnControlled as ReactCodeMirror} from 'react-codemirror2'
import codemirror from 'codemirror'

// require('codemirror/mode/javascript/javascript')
// require('codemirror/addon/hint/show-hint')
// require('codemirror/addon/edit/closebrackets')

export interface QueryEditorProps {
  onExecute: () => void
  onChange: ({query: string}) => void
  value?: string
  schema?: any
  className?: string
  onHeightChange?: () => void
  height?: number
}

class QueryEditor extends React.PureComponent<QueryEditorProps> {
  constructor(props: QueryEditorProps) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(editor: codemirror.Editor, data: codemirror.EditorChange, value: string) {
    const {onChange} = this.props

    onChange({query: value})
  }

  render() {
    const {className = 'vision_query-editor', onExecute, value} = this.props

    const options: codemirror.EditorConfiguration = {
      lineNumbers: true,
      tabSize: 2,
      mode: {name: 'javascript'},
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Ctrl-Enter': onExecute,
      },
    }

    return (
      <ReactCodeMirror
        value={value}
        onChange={this.handleChange}
        options={options}
        className={className}
        autoCursor={false}
        autoScroll
      />
    )
  }
}

export default QueryEditor
