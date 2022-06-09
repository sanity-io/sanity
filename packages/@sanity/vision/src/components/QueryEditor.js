/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-unassigned-import */
import React from 'react'
import {UnControlled as BaseReactCodeMirror} from 'react-codemirror2'
import CodeMirror from 'codemirror'
import styled from 'styled-components'
import {rem} from '@sanity/ui'

require('codemirror/mode/javascript/javascript')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/edit/closebrackets')

const ReactCodeMirror = styled(BaseReactCodeMirror)`
  width: 100%;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  position: relative;

  .CodeMirror {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .CodeMirror-sizer {
    padding-top: ${({theme}) => rem(theme.sanity.space[5])};
  }

  .CodeMirror-linenumber {
    padding: 0 3px 0 5px;
    min-width: 1.5rem;
    text-align: right;
    color: var(--card-code-fg-color);
    white-space: nowrap;
  }
`

class QueryEditor extends React.PureComponent {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
    this.getHint = this.getHint.bind(this)
  }

  getHint(cm, option) {
    const {schema} = this.props
    const cursor = cm.getCursor()
    // const line = cm.getLine(cursor.line)
    const start = cursor.ch
    const end = cursor.ch
    const suggestions = [
      {
        text: '...',
        displayText: '... (Includes everything)',
      },
    ]

    if (schema) {
      schema._original.types.forEach((type) => {
        suggestions.push({
          text: type.name,
          displayText: `${type.name} (${type.type}) - ${type.title}`,
        })
      })
    }
    return {
      list: suggestions,
      from: CodeMirror.Pos(cursor.line, start),
      to: CodeMirror.Pos(cursor.line, end),
    }
  }

  handleChange(editor, metadata, value) {
    this.props.onChange({query: value})
  }

  render() {
    const options = {
      theme: 'default CodeMirror-vision',
      lineNumbers: true,
      tabSize: 2,
      mode: {name: 'javascript', json: true},
      hintOptions: {hint: this.getHint},
      extraKeys: {
        Tab: false,
        'Ctrl-Space': 'autocomplete',
        'Ctrl-Enter': this.props.onExecute,
      },
      autoCloseBrackets: true,
    }
    return (
      <ReactCodeMirror
        value={this.props.value}
        onChange={this.handleChange}
        options={options}
        className={this.props.className}
        onHeightChange={this.props.onHeightChange}
        autoCursor={false}
        autoScroll
      />
    )
  }
}

QueryEditor.defaultProps = {
  className: 'vision_query-editor',
}

export default QueryEditor
