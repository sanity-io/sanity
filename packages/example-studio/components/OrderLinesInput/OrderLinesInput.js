import PropTypes from 'prop-types'
import React from 'react'
import {FormBuilderInput} from 'part:@sanity/form-builder'
import PatchEvent, {inc, setIfMissing} from 'part:@sanity/form-builder/patch-event'

export default class OrderLinesInput extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    value: PropTypes.shape({
      _type: PropTypes.string,
      orders: PropTypes.array,
      nextOrderNumber: PropTypes.number
    }),
    level: PropTypes.number,
    onChange: PropTypes.func.isRequired
  }

  handleOrdersChange = (event: PatchEvent) => {
    const {value, type, onChange} = this.props
    let incPatch = null
    const patches = event.patches.map(patch => {
      if (patch.type !== 'insert' || patch.path.length !== 1) {
        return patch
      }
      incPatch = inc(1, ['nextOrderNumber'])
      return {
        ...patch,
        items: patch.items.map(item => ({
          ...item,
          number: value ? value.nextOrderNumber : 1
        }))
      }
    })

    let ev = PatchEvent.from(patches)
      .prefixAll('orders')
      .prepend([setIfMissing({_type: type.name, nextOrderNumber: 1})])

    if (incPatch) ev = ev.append(incPatch)

    onChange(ev)
  }

  render() {
    const {type, level, value, ...rest} = this.props
    const orders = value && value.orders
    const ordersType = type.fields.find(field => field.name === 'orders').type

    return (
      <FormBuilderInput
        {...rest}
        onChange={this.handleOrdersChange}
        path={['orders']}
        type={ordersType}
        level={level}
        value={orders}
      />
    )
  }
}
