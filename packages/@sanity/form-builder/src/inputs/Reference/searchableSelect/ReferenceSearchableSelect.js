import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import FormField from 'part:@sanity/components/formfields/default'
import Preview from '../../../Preview'
import subscriptionManager from '../../../utils/subscriptionManager'
import PatchEvent, {set, setIfMissing, unset} from '../../../PatchEvent'

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
    onChange: PropTypes.func,
    level: PropTypes.number
  }

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
    if (!value || !value._ref) {
      return
    }

    this.subscriptions.replace('valueToString', valueToString(value, type)
      .subscribe(valueAsString => {
        this.setState({valueAsString})
      }))
  }

  getMemberTypeFor(typeName) {
    const {type} = this.props
    return type.to.find(ofType => ofType.type.name === typeName)
  }

  handleFocus = () => {
    this.search(this._lastQuery || '')
  }

  handleChange = item => {
    this.props.onChange(PatchEvent.from(
      setIfMissing({
        _type: 'reference',
        _ref: item._id
      }),
      set(item._id, ['_ref'])
    ))
  }

  handleSearch = query => {
    this.search(query)
  }

  search = query => {
    const {type, searchFn} = this.props

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
    this.props.onChange(PatchEvent.from(unset()))
  }

  render() {
    const {
      type,
      value,
      level,
      searchFn,
      valueToString,
      ...rest
    } = this.props
    const {valueAsString, fetching, hits} = this.state

    const valueFromHit = value && hits.find(hit => hit._id === value._ref)

    return (
      <FormField label={type.title} level={level} description={type.description}>
        <SearchableSelect
          {...rest}
          placeholder="Type to search…"
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onSearch={this.handleSearch}
          onChange={this.handleChange}
          onClear={this.handleClear}
          value={valueFromHit}
          inputValue={valueAsString}
          renderItem={this.renderItem}
          isLoading={fetching}
          items={hits}
        />
      </FormField>
    )
  }
}
