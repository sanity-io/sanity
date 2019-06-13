import React from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, set} from 'part:@sanity/form-builder/patch-event'
import FormField from 'part:@sanity/components/formfields/default'

export default class SvgFileToStringInput extends React.Component {
  inputRef = React.createRef()
  static propTypes = {
    value: PropTypes.string,
    type: PropTypes.object,
    level: PropTypes.number,
    onChange: PropTypes.func
  }

  focus() {
    this.inputRef.current.focus()
  }

  handleChange = event => {
    const file = event.target.files[0]
    if (file.type !== 'image/svg+xml') {
      window.alert(`The type of the selected file is not svg: ${file.type}`)
      return
    }
    const reader = new FileReader()
    reader.onload = readerEvent => {
      this.props.onChange(PatchEvent.from(set(readerEvent.target.result)))
    }
    reader.readAsText(file)
  }

  render() {
    const {value, type, level} = this.props
    return (
      <FormField label={type.title} level={level} description={type.description}>
        <input
          ref={this.inputRef}
          type="file"
          placeholder={type.placeholder}
          onChange={this.handleChange}
        />
        {value && (
          <div>
            <div>Current value:</div>
            <textarea style={{width: '100%'}} value={value} />
          </div>
        )}
      </FormField>
    )
  }
}
