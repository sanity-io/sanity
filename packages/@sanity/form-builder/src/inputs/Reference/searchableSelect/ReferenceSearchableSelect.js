import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import Button from 'part:@sanity/components/buttons/default'
import styles from './ReferenceSearchableSelect.css'
import Preview from '../../../Preview'
import subscriptionManager from '../../../utils/subscriptionManager'
import PatchEvent, {set, setIfMissing, unset} from '../../../PatchEvent'

const INITIAL_STATE = {
  fetching: false,
  hits: [],
  valueAsString: null,
}

const CREATE_NEW_ITEM = {}

export default class ReferenceSearchableSelect extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    value: PropTypes.object,
    onCreateNew: PropTypes.func,
    searchFn: PropTypes.func.isRequired,
    valueToStringFn: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    level: PropTypes.number
  }

  static defaultProps = {
    onChange() {}
  }

  state = INITIAL_STATE

  subscriptions = subscriptionManager('search', 'valueToString')

  componentWillUnmount() {
    this.subscriptions.unsubscribeAll()
  }

  componentDidMount() {
    this.fetchValueAsString(this.props.value)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState(INITIAL_STATE)
      this.fetchValueAsString(nextProps.value)
    }
  }

  fetchValueAsString(value) {
    const {valueToStringFn, type} = this.props
    if (!value || !value._ref) {
      return
    }

    this.subscriptions.replace('valueToString', valueToStringFn(value, type)
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
    if (item === CREATE_NEW_ITEM) {
      const {onCreateNew, type} = this.props
      onCreateNew({_type: type.to[0].name})
      return
    }
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

  search = inputValue => {
    const {type, searchFn} = this.props

    if (inputValue === '') {
      this.search('*')
      return
    }

    this._lastQuery = inputValue
    this.setState({
      inputValue: inputValue === '*' ? '' : inputValue,
      fetching: true
    })

    this.subscriptions.replace('search', searchFn(inputValue, type)
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
    if (item === CREATE_NEW_ITEM) {
      const {type} = this.props

      return (
        <Button className={styles.createNew}>
          Create a new {type.to[0].title}…
        </Button>
      )
    }
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
    const {type, value, level} = this.props
    const {valueAsString, fetching, hits} = this.state

    const valueFromHit = value && hits.find(hit => hit._id === value._ref)
    return (
      <SearchableSelect
        label={type.title}
        level={level}
        description={type.description}
        placeholder="Type to search…"
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onSearch={this.handleSearch}
        onChange={this.handleChange}
        onClear={this.handleClear}
        value={valueFromHit}
        valueAsString={valueAsString}
        renderItem={this.renderItem}
        loading={fetching}
        items={[CREATE_NEW_ITEM, ...hits]}
      />
    )
  }
}
