import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Select from 'part:@sanity/components/selects/default'
import RadioSelect from 'part:@sanity/components/selects/radio'
import PatchEvent, {set} from '../PatchEvent'

const EMPTY_ITEM = {title: '', value: undefined}

export default class StringSelect extends React.PureComponent {

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  }

  static defaultProps = {
    value: '',
    onChange() {}
  }

  handleChange = item => {
    const {onChange} = this.props

    onChange(PatchEvent.from(set(typeof item === 'string' ? item : item.value)))
  }

  render() {
    const {value, type, level} = this.props

    // Support array of string if not objects
    let items = type.options.list

    if ((typeof items[0]) === 'string') {
      items = items.map(item => {
        return {
          title: item,
          value: item
        }
      })
    }

    const currentItem = items.find(item => item.value === value)

    const isRadio = type.options && type.options.layout === 'radio'
    return isRadio
      ? <RadioSelect
        name={type.name}
        legend={type.title}
        level={level}
        items={items}
        onChange={this.handleChange}
        value={currentItem}
        direction={type.options.direction || 'vertical'}
      />
      : <Select
        label={type.title}
        level={level}
        value={currentItem}
        placeholder={type.placeholder}
        onChange={this.handleChange}
        items={[EMPTY_ITEM].concat(items)}
      />

  }
}
