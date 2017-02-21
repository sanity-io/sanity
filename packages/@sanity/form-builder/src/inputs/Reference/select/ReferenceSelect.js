import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import Select from 'part:@sanity/components/selects/default'
import subscriptionManager from '../../../utils/subscriptionManager'

export default class ReferenceSelect extends React.Component {

  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.object,
    fetchAllFn: PropTypes.func,
    fetchValueFn: PropTypes.func,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    items: [],
    refCache: {},
    showDialog: false,
    materializedValue: null,
    fetching: false,
    dialogSelectedItem: null
  }

  subscriptions = subscriptionManager('search', 'fetchValue')

  componentWillMount() {
    this.syncValue(this.props.value)
    this.fetchAll()
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribeAll()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.syncValue(nextProps.value)
    }
  }

  syncValue(value) {
    const {fetchValueFn, type} = this.props

    if (value.isEmpty()) {
      this.setState({materializedValue: null})
      return
    }

    const serialized = value.serialize()
    this.subscriptions.replace('fetchValue', fetchValueFn(serialized, type)
      .subscribe(materializedValue => {
        this.setState({materializedValue})
      }))
  }

  fetchAll() {
    const {fetchAllFn, type} = this.props

    this.setState({isSearching: true})

    this.subscriptions.replace('search', fetchAllFn(type)
      .subscribe(items => {
        const updatedCache = items.reduce((cache, item) => {
          cache[item._id] = item
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          items: items,
          isSearching: false,
          refCache: updatedCache
        })
      })
    )
  }

  handleChange = item => {
    const patch = {
      type: 'set',
      value: {
        _type: 'reference',
        _ref: item._id
      }
    }
    this.props.onChange({patch: patch})
  }

  render() {
    const {type} = this.props
    const {items, materializedValue} = this.state

    const selected = materializedValue
      ? (items.find(item => item._id === materializedValue._id) || materializedValue)
      : null

    return (
      <Select
        label={type.title}
        description={type.description}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        items={items}
        value={selected}
      />
    )
  }
}
