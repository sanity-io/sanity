import React from 'react'
import FormBuilderField from '../FormBuilderFieldMixin'
import Keywords from '../../inputs/Keywords'

export default React.createClass({

  displayName: 'Tags',

  propTypes: {
    field: React.PropTypes.shape({
      tags: React.PropTypes.arrayOf(
        React.PropTypes.shape({
          text: React.PropTypes.string,
          value: React.PropTypes.string
        })
      ),
      style: React.PropTypes.oneOf(['checkboxes', 'input'])
    })
  },

  mixins: [FormBuilderField],

  onChange(e) {
    const oldValue = this._getValue() || []
    let newValue = oldValue
    const targetValue = e.target.value
    if (e.target.checked) {
      if (oldValue.indexOf(targetValue) === -1) {
        newValue.push(targetValue)
      }
    } else {
      newValue = oldValue.filter((val) => {
        return val !== targetValue
      })
    }
    this._setValue(newValue)
  },

  render() {

    if (this.props.field.style && this.props.field.style === 'input') {
      // TODO: make this
      const props = {
        keywords: this.props.field.tags
      }
      return <Keywords {...props}/>
    }

    const tags = this.props.field.tags || []
    const value = this._getValue() || []
    const checkBoxes = tags.map((tag, i) => {
      return (
        <label key={`tag_${i}`} className="form-builder__tags__tag">
          <input
            onClick={this.onChange}
            type="checkbox" value={tag.value}
            defaultChecked={value.indexOf(tag.value) > -1}/>
          <span>{tag.text}</span>
        </label>
      )
    })

    return (
      <div className="form-builder__tags">
        <fieldset className="form-builder__fieldset">
          <div className="form-builder__legend">{this.props.field.title}</div>

          {
            this.props.field.description &&
              <div className='form-builder__help-text'>{this.props.field.description}</div>
          }

          {checkBoxes}
        </fieldset>
      </div>
    )
  }
})
