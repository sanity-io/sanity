/* eslint-disable import/no-extraneous-dependencies */
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import {get} from 'lodash'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Checkbox from 'part:@sanity/components/toggles/checkbox'

export default class ArrayOfStringsSelect extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.arrayOf(PropTypes.string),
    level: PropTypes.number,
    onChange: PropTypes.func
  }

  state = {
    focusedItem: null
  }

  handleChange = event => {
    const {onChange, type, value = []} = this.props

    const list = get(type, 'options.list')

    const nextValue = list
      .map(item => item.value)
      .filter(itemValue => {
        return event.target.value === itemValue ? event.target.checked : value.includes(itemValue)
      })

    onChange({
      patch: nextValue.length > 0
        ? {type: 'set', value: nextValue}
        : {type: 'unset'}
    })
  }

  handleFocus = item => {
    this.setState({
      focusedItem: item
    })
  }

  handleBlur = () => {
    this.setState({
      focusedItem: null
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

              const checked = Boolean(value) && value.includes(item.value)

              return (
                <div
                  key={item.value}
                  style={{
                    display: direction === 'horizontal' ? 'inline-block' : 'block',
                    marginRight: direction === 'horizontal' ? '1em' : '0',
                  }}
                >
                  <Checkbox
                    label={item.title}
                    value={item.value}
                    item={item}
                    onChange={this.handleChange}
                    checked={checked}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    focus={this.state.focusedItem === item}
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
