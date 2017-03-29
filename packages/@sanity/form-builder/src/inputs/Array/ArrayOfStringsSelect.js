/* eslint-disable import/no-extraneous-dependencies */
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import {get} from 'lodash'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import PatchEvent, {set, unset} from '../../PatchEvent'

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
    const {type, value = []} = this.props

    const list = get(type, 'options.list')

    const eventValue = event.target.value

    const nextValue = list
      .filter(item => (
        eventValue === item.value
          ? event.target.checked
          : value.includes(item.value)
      ))
      .map(item => item.value)

    this.set(nextValue)
  }

  set(nextValue) {
    this.props.onChange(PatchEvent.from(nextValue.length > 0 ? set(nextValue) : unset()))
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
                    hasFocus={this.state.focusedItem === item}
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
