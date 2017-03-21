import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import Preview from '../../../Preview'
import subscriptionManager from '../../../utils/subscriptionManager'

const getInitialState = () => {
  return {
    fetching: false,
    hits: [],
    valueAsString: null,
  }
}

export default class ReferenceSearchableSelect extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    value: PropTypes.object,
    searchFn: PropTypes.func,
    valueToString: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = getInitialState()

  subscriptions = subscriptionManager('search', 'valueToString')

  componentWillUnmount() {
    this.subscriptions.unsubscribeAll()
  }

  componentDidMount() {
    this.fetchValueAsString(this.props.value)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState(getInitialState())
      this.fetchValueAsString(nextProps.value)
    }
  }

  fetchValueAsString(value) {
    const {valueToString, type} = this.props
    if (value.isEmpty()) {
      return
    }
    const serialized = value.serialize()

    this.subscriptions.replace('valueToString', valueToString(serialized, type)
      .subscribe(valueAsString => {
        this.setState({valueAsString})
      }))
  }

  getMemberTypeFor(typeName) {
    const {type} = this.props
    return type.to.find(ofType => ofType.type.name === typeName)
  }

  handleFocus = () => {
    this.search(this._lastQuery || '*')
  }

  handleChange = item => {
    const setIfMissingPatch = {
      type: 'setIfMissing',
      value: {
        _type: 'reference',
        _ref: item._id
      }
    }
    const setPatch = {
      type: 'set',
      path: ['_ref'],
      value: item._id
    }
    this.props.onChange({
      patch: [setIfMissingPatch, setPatch]
    })
  }

  handleSearch = query => {
    this.search(query)
  }

  search = query => {
    const {type, searchFn} = this.props

    if (query === '') {
      this.search('*')
      return
    }

    this._lastQuery = query
    this.setState({
      fetching: true
    })

    this.subscriptions.replace('search', searchFn(query, type)
      .subscribe(items => {
        const updatedCache = items.reduce((cache, item) => {
          cache[item._id] = item
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          items: items,
          hits: items,
          fetching: false,
          refCache: updatedCache
        })
      }))
  }

  renderItem = item => {
    const type = this.getMemberTypeFor(item._type)
    return (
      <Preview
        type={type}
        value={item}
        layout="default"
      />
    )
  }

  handleClear = item => {
    const patch = {
      type: 'unset'
    }
    this.props.onChange({patch: patch})
  }

  render() {
    const {type} = this.props
    const {valueAsString, fetching, hits} = this.state

    const value = hits.find(item => item._id === this.props.value.refId)

    return (
      <SearchableSelect
        label={type.title}
        description={type.description}
        placeholder="Type to search…"
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onSearch={this.handleSearch}
        onChange={this.handleChange}
        onClear={this.handleClear}
        value={value || this.props.value}
        valueAsString={valueAsString}
        renderItem={this.renderItem}
        loading={fetching}
        items={hits}
      />
    )
  }
}
