import React from 'react'
import PropTypes from 'prop-types'
import ReactCodeMirror from 'react-codemirror2'
import CodeMirror from 'codemirror'
require('codemirror/mode/javascript/javascript')
require('codemirror/addon/hint/show-hint')

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
        displayText: '... (Includes everything)'
      }
    ]

    if (schema) {
      schema._original.types.forEach(type => {
        suggestions.push({
          text: type.name,
          displayText: `${type.name} (${type.type}) - ${type.title}`
        })
      })
    }
    return {
      list: suggestions,
      from: CodeMirror.Pos(cursor.line, start),
      to: CodeMirror.Pos(cursor.line, end)
    }
  }

  handleChange(editor, metadata, value) {
    this.props.onChange({query: value})
  }

  render() {
    const options = {
      lineNumbers: true,
      tabSize: 2,
      scrollbarStyle: null,
      mode: {name: 'javascript', json: true},
      hintOptions: {hint: this.getHint},
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Ctrl-Enter': this.props.onExecute
      }
    }
    return (
      <ReactCodeMirror
        value={this.props.value}
        onChange={this.handleChange}
        options={options}
        className={this.props.className}
      />
    )
  }
}

QueryEditor.propTypes = {
  onExecute: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  schema: PropTypes.object
}

QueryEditor.defaultProps = {
  className: 'vision_query-editor'
}

export default QueryEditor
