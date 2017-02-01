/* eslint-disable import/no-extraneous-dependencies */
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import {get, filter} from 'lodash'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Checkbox from 'part:@sanity/components/toggles/checkbox'

export default class ArrayOfStringsSelect extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.arrayOf(PropTypes.string),
    level: PropTypes.number,
    onChange: PropTypes.func,
    focus: PropTypes.bool
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    hasFocus: this.props.focus
  }

  handleRemoveItem = index => {
    const nextVal = this.props.value.slice()
    nextVal.splice(index, 1)
    this.props.onChange({
      patch: {
        type: 'set',
        value: nextVal
      }
    })
  }

  handleChange = event => {
    const eventValue = event.target.value
    const {onChange, value} = this.props
    let nextValue = (value && value.slice()) || []
    const hasValue = value && value.find(item => item === eventValue)

    if (hasValue) {
      nextValue = filter(nextValue, item => {
        return item != eventValue
      })
    } else {
      nextValue.push(eventValue)
    }

    onChange({
      patch: {
        type: 'set', value: nextValue
      }
    })
  }

  render() {
    const {type, value, level} = this.props

    const list = get(type, 'options.list')
    const direction = get(type, 'options.direction')

    return (
      <Fieldset legend={type.title} description={type.description} level={level}>
        <div>
          {
            list.map(item => {

              const checked = value && !!value.find(valueItem => valueItem === item.value)

              return (
                <div
                  key={item.value}
                  style={{
                    display: direction == 'horizontal' ? 'inline-block' : 'block',
                    marginRight: direction == 'horizontal' ? '1em' : '0',
                  }}
                >
                  <Checkbox
                    label={item.title}
                    value={item.value}
                    onChange={this.handleChange}
                    data-key={item.value}
                    checked={checked}
                  />
                </div>
              )
            })
          }
        </div>
      </Fieldset>
    )
  }
}
