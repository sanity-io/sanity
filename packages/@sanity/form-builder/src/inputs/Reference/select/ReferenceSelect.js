// @flow
import PropTypes from 'prop-types'
import React from 'react'
import Select from 'part:@sanity/components/selects/default'
import FormField from 'part:@sanity/components/formfields/default'
import subscriptionManager from '../../../utils/subscriptionManager'
import PatchEvent, {set, setIfMissing, unset} from '../../../PatchEvent'
import type {Reference, Type} from '../../../typedefs'

const EMPTY = {}

type Props = {
  type: Type,
  value?: Reference,
  fetchAllFn: Function,
  fetchValueFn: Function,
  onChange: PatchEvent => void
}
type Item = typeof EMPTY | Reference

type State = {
  items: Array<Item>,
  refCache: Object,
  materializedValue: ?Object
}

export default class ReferenceSelect extends React.Component<Props, State> {
  static defaultProps = {
    onChange() {}
  }
  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    items: [],
    refCache: {},
    materializedValue: null
  }

  subscriptions = subscriptionManager('search', 'fetchValue')

  componentWillMount() {
    this.syncValue(this.props.value)
    this.fetchAll()
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribeAll()
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.value !== nextProps.value) {
      this.syncValue(nextProps.value)
    }
  }

  syncValue(value: Reference) {
    const {fetchValueFn, type} = this.props

    if (!value || !value._ref) {
      this.setState({materializedValue: null})
      return
    }

    this.subscriptions.replace('fetchValue', fetchValueFn(value, type)
      .subscribe(materializedValue => {
        this.setState({materializedValue})
      }))
  }

  fetchAll() {
    const {fetchAllFn, type} = this.props
    this.subscriptions.replace('search', fetchAllFn(type)
      .subscribe(items => {
        const updatedCache = items.reduce((cache, item) => {
          cache[item._id] = item
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          items: items,
          refCache: updatedCache
        })
      }))
  }

  handleChange = (item: Item) => {
    const {onChange} = this.props

    onChange(PatchEvent.from(item === EMPTY
      ? unset()
      : [
        setIfMissing({
          _type: 'reference',
          _ref: item._id
        }),
        set(item._id, ['_ref'])
      ]))
  }

  render() {
    const {type} = this.props
    const {items, materializedValue} = this.state

    const selected = materializedValue
      ? (items.find(item => item._id === materializedValue._id) || materializedValue)
      : null

    return (
      <FormField label={type.title} description={type.description}>
        <Select
          onChange={this.handleChange}
          items={[EMPTY, ...items]}
          value={selected}
        />
      </FormField>

    )
  }
}
