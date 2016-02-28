import React from 'react'
import _t from '../../../../lib/translate'._t
import Browser from './Browser'
import Dispatchable from '../../../../lib/mixins/Dispatchable'
import FormBuilderField from '../../FormBuilderFieldMixin'

export default React.createClass({

  displayName: 'ReferencePicker',

  propTypes: {
    documents: React.PropTypes.array,
    onChange: React.PropTypes.func,
    field: React.PropTypes.object,
    fieldPreviews: React.PropTypes.object,
    schema: React.PropTypes.object
  },

  mixins: [FormBuilderField, Dispatchable],

  actions: {
    DOCUMENT_FILTER_COMPLETED({filter, documents}) {
      if (filter == this.state.filter) {
        this.setState({hits: documents, loading: false})
      }
    }
  },

  getInitialState() {
    return {
      hits: [],
      filter: null,
      loading: false
    }
  },

  itemToValue(item) {
    const store = item.path ? item.path : null // TODO: use real store when it's ready.
    return {
      type: 'reference',
      to: item.type,
      id: item.id,
      store: store
    }
  },

  handleQueryInputKeyUp(event) {
    const query = event.target.value.split(/\s+/).join('* ') + '*'
    clearTimeout(this.typingTimer)
    this.typingTimer = setTimeout(() => {
      this.doSearch(query)
    }, 500)
  },

  getSearchAttribute() {
    const type = this.props.schema[this.props.field.to]
    if (type && type.searchAttribute) {
      return type.searchAttribute
    }
    return null
  },

  componentWillMount() {
    this.typingTimer = null
    this.doSearch('*')
  },

  componentWillUnmount() {
    clearTimeout(this.typingTimer)
    this.typingTimer = null
  },

  doSearch(query) {
    const filter = {
      type: this.props.field.to,
      query: query,
      limit: 100,
      sortBy: 'updatedAt',
      filterId: `filter-${(new Date()).getTime()}`
    }
    const searchAttribute = this.getSearchAttribute()
    if (searchAttribute) {
      filter.matchInField = searchAttribute
    }
    this.appDispatcher.requestFilterDocuments(filter)
    this.setState({filter, loading: true})
  },

  renderValue() {
    const value = this._getValue()
    return <div>{JSON.stringify(value)}</div>
  },

  handleSelectItem(item) {
    if (this.props.onChange) {
      this.props.onChange(this.itemToValue(item), item)
    }
  },

  renderBrowser() {
    const {fieldPreviews} = this.props
    const {hits, filter} = this.state
    return (
      <div>
        {filter && hits.length == 0 && (
          <div className="reference-input__no-hits">{_t('formBuilder.fields.reference.noHits')}</div>
        )}
        <div>
        <Browser
          fieldPreviews={fieldPreviews}
          items={hits}
          selected={this._getValue()}
          onSelectItem={this.handleSelectItem}
          loading={this.state.loading}/>
        </div>
      </div>
    )
  },

  render() {
    return (
      <div className="reference-input reference-input--single reference-input--browse-mode">
        <div className="form-group reference-input__query-group">
          <input
            className="form-control reference-input__query-input"
            onKeyUp={this.handleQueryInputKeyUp}
            type="text"
            placeholder={_t('formBuilder.fields.reference.search')}/>
        </div>
        {this.renderBrowser()}
      </div>
    )
  }
})
