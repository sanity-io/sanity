import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../../FormBuilderPropTypes'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import Preview from '../../../previews/Preview'
import stringPreview from '../../../sanity/preview/stringPreview'
import {uniqBy} from 'lodash'

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

  state = {
    fetching: false,
    query: null,
    hits: [],
    materializedValue: null
  }

  materializeValue(value) {
    const {materializeReferences} = this.props

    if (!value.refId) {
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
    return type.to.find(ofType => {
      return ofType.type === typeName
    })
  }

  handleFocus = () => {
    //
  }

  handleChange = item => {
    debugger
    const patch = [
      {
        type: 'setIfMissing',
        path: [],
        value: {_type: 'reference'}
      },
      {
        type: 'set',
        path: ['_ref'],
        value: item._id
      }
    ]
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
    const field = this.getItemFieldForType(item._type)
    return (
      <Preview
        field={field}
        value={item}
        style="default"
      />
    )
  }

  valueToString = value => {
    const field = this.getItemFieldForType(value._type)
    const type = field.type === 'object' ? field : this.context.formBuilder.schema.getType(field.type)
    return value ? stringPreview(value, type) : ''
  }

  render() {
    const {field} = this.props
    const {materializedValue, fetching, hits} = this.state

    return (
      <SearchableSelect
        label={field.title}
        description={field.description}
        placeholder="Type to search…"
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onSearch={this.handleSearch}
        onChange={this.handleChange}
        value={materializedValue}
        valueToString={this.valueToString}
        renderItem={this.renderItem}
        loading={fetching}
        items={hits}
      />
    )
  }
}
