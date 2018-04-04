//@flow
import React from 'react'
import Select from 'part:@sanity/components/selects/default'
import RadioSelect from 'part:@sanity/components/selects/radio'
import PatchEvent, {set} from '../PatchEvent'
import FormField from 'part:@sanity/components/formfields/default'
import type {Type, Marker} from '../typedefs'
import {uniqueId} from 'lodash'

const EMPTY_ITEM = {title: '', value: undefined}

function toSelectItems(list) {
  return typeof list[0] === 'string' ? list.map(item => ({title: item, value: item})) : list
}

type Props = {
  type: Type,
  level: number,
  value: ?string,
  readOnly: ?boolean,
  onChange: PatchEvent => void,
  markers: Array<Marker>
}

export default class StringSelect extends React.Component<Props> {
  _input: ?(RadioSelect | Select)
  static defaultProps = {
    value: ''
  }

  componentDidMount() {
    this.name = uniqueId('RadioName')
  }

  handleChange = (item: Object) => {
    const {onChange} = this.props

    onChange(PatchEvent.from(set(typeof item === 'string' ? item : item.value)))
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (input: ?(RadioSelect | Select)) => {
    this._input = input
  }

  render() {
    const {value, readOnly, markers, type, level, ...rest} = this.props
    const items = toSelectItems(type.options.list || [])

    const currentItem = items.find(item => item.value === value)

    const isRadio = type.options && type.options.layout === 'radio'

    return (
      <FormField markers={markers} level={level} label={type.title} description={type.description}>
        {isRadio ? (
          // todo: make separate inputs
          <RadioSelect
            {...rest}
            name={this.name || type.name}
            legend={type.title}
            items={items}
            onChange={this.handleChange}
            value={currentItem}
            direction={type.options.direction || 'vertical'}
            ref={this.setInput}
            readOnly={readOnly}
          />
        ) : (
          <Select
            {...rest}
            label={type.title}
            value={currentItem}
            placeholder={type.placeholder}
            onChange={this.handleChange}
            items={[EMPTY_ITEM].concat(items)}
            ref={this.setInput}
            readOnly={readOnly}
          />
        )}
      </FormField>
    )
  }
}
