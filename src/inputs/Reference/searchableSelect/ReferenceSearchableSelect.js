import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import SearchableSelect from 'part:@sanity/components/selects/searchable'

export default class Reference extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    searchFn: PropTypes.func,
    materializeReferences: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  constructor(props, ...rest) {
    super(props, ...rest)

    this.state = {
      fetching: false,
      query: null,
      hits: []
    }
  }

  materializeValue(value) {
    const {materializeReferences} = this.props

    if (value.isEmpty()) {
      return
    }

    materializeReferences([value.refId])
      .then(materializedRefs => {
        return this.createValueFromDoc(materializedRefs[0])
      })
      .then(materializedValue => {
        const {refCache} = this.state

        this.setState({
          materializedValue: materializedValue,
          refCache: Object.assign({}, refCache, {
            [materializedValue.value._id]: materializedValue
          })
        })
      })

  }

  componentDidMount() {
    const {value} = this.props
    this.materializeValue(value)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.props.value) {
      this.materializeValue(nextProps.value)
    }
  }

  getItemFieldForType(typeName) {
    const {type} = this.props
    return type.to.find(ofType => {
      return ofType.type === typeName
    })
  }

  createValueFromDoc = doc => {
    return this.context.formBuilder.createFieldValue(doc, this.getItemFieldForType(doc._type))
  }
  createValueFromHit = hit => {
    return this.createValueFromDoc(hit.document)
  }

  handleFocus = () => {
    //
  }

  handleChange = item => {
    const patch = {
      type: 'set',
      value: {
        _type: 'reference',
        _ref: item.key
      }
    }
    this.props.onChange({patch: patch})
  }

  handleSearch = query => {
    const {searchFn, field} = this.props

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

    searchFn(query, field)
      .then(hits => {
        if (this._currentQuery !== query) {
          return // ignore
        }

        const preparedHits = hits.map(hit => {
          return Object.assign({}, hit, {
            value: this.createValueFromHit(hit)
          })
        })

        const updatedCache = preparedHits.reduce((cache, hit) => {
          cache[hit.value.value._id] = hit.value
          return cache
        }, Object.assign({}, this.state.refCache))

        this.setState({
          hits: preparedHits,
          fetching: false,
          refCache: updatedCache,
          query: query
        })
      })
  }

  handleBlur = event => {
    //
  }

  render() {
    const {value, field} = this.props
    const {fetching, hits, materializedValue} = this.state

    const items = hits.map((item, i) => {
      return {
        key: item.value.value._id,
        title: item.value.value.name.value
      }
    })

    const materializedSelected = materializedValue && {
      title: materializedValue.value.name.value,
      key: materializedValue.value._id
    }

    const selectedItem = items.find(item => item.key === value.refId) || materializedSelected

    return (
      <SearchableSelect
        label={field.title}
        description={field.description}
        placeholder="Type to search…"
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onSearch={this.handleSearch}
        onChange={this.handleChange}
        value={selectedItem}
        loading={fetching}
        items={items || [value]}
      />
    )
  }
}
