import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import Preview from '../../../Preview'

export default class Reference extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.object,
    searchFn: PropTypes.func,
    stringifyValue: PropTypes.func,
    materializeReferences: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    fetching: false,
    query: null,
    hits: [],
    materializedValue: null
  }

  materializeValue(value) {
    const {materializeReferences} = this.props

    if (value.isEmpty()) {
      return
    }

    materializeReferences([value.refId])
      .then(materializedRefs => {
        return materializedRefs[0]
      })
      .then(materializedValue => {
        const {refCache} = this.state
        this.setState({
          materializedValue: materializedValue,
          refCache: Object.assign({}, refCache, {
            [materializedValue._id]: materializedValue
          })
        })
      })
  }

  componentDidMount() {
    const {value} = this.props
    if (value) {
      this.materializeValue(value)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.props.value) {
      this.materializeValue(nextProps.value)
    }
  }

  getItemFieldForType(typeName) {
    const {type} = this.props
    return type.to.find(ofType => ofType.type.name === typeName)
  }

  fetchAll() {
    const {searchFn, type} = this.props

    searchFn('*', type)
      .then(items => {
        this._isFetching = false

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
      })
  }

  handleFocus = () => {
    this.fetchAll()
  }

  handleChange = item => {
    const patch = {
      type: 'set',
      value: {
        _type: 'reference',
        _ref: item._id
      }
    }

    console.log('Do patch!', patch)
    this.props.onChange({patch: patch})
  }

  handleSearch = query => {
    const {type, searchFn} = this.props

    if (query === '') {
      this.fetchAll()
      return
    }

    if (this._currentQuery === query) {
      return
    }

    this._currentQuery = query

    if (!query) {
      return
    }

    this.setState({
      fetching: true
    })

    searchFn(query, type)
      .then(hits => {
        if (this._currentQuery !== query) {
          return // ignore
        }

        const nextRefCache = hits.reduce((cache, hit) => {
          cache[hit._id] = hit
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          fetching: false,
          hits: hits,
          refCache: nextRefCache,
          query: query
        })
      })
  }

  renderItem = item => {
    const type = this.getItemFieldForType(item._type)
    return (
      <Preview
        type={type}
        value={item}
        view="default"
      />
    )
  }

  valueToString = value => {
    const {stringifyValue} = this.props
    return value ? stringifyValue(value) : ''
  }

  render() {
    const {type} = this.props
    const {materializedValue, fetching, hits} = this.state
    return (
      <SearchableSelect
        label={type.title}
        description={type.description}
        placeholder="Type to search…"
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onSearch={this.handleSearch}
        onChange={this.handleChange}
        value={materializedValue}
        valueToString={this.valueToString}
        renderItem={this.renderItem}
        loading={fetching}
        items={[materializedValue].concat(hits).filter(Boolean)}
      />
    )
  }
}
