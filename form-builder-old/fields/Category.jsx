import React from 'react'
import AutoComplete from '../../../widgets/inputs/AutoComplete'
import Dispatchable from '../../../lib/mixins/Dispatchable'
import FormBuilderField from '../FormBuilderFieldMixin'
const categoryDragnetQueryIdentifier = 'categoryDragnet'

export default React.createClass({
  displayName: 'Category',
  mixins: [FormBuilderField, Dispatchable],

  actions: {
    DOCUMENT_FILTER_COMPLETED({filter, documents}) {
      if (filter.queryIdentifier == categoryDragnetQueryIdentifier) {
        const field = this.props.field.name
        const uniqueValues = Array.from(new Set(documents.map((doc) => doc[field]))).filter(Boolean)
        this.setState({
          categories: uniqueValues,
          waiting: false
        })
      }
    }
  },

  getInitialState() {
    return {
      categories: [],
      waiting: true,
      fieldInput: ''
    }
  },

  componentDidMount() {
    const doc = this.props.document
    if (doc && doc && doc.type) {
      const filter = {
        queryIdentifier: categoryDragnetQueryIdentifier,
        type: doc.type,
        path: doc.path,
        limit: 1000
      }
      this.appDispatcher.requestFilterDocuments(filter)
    }
  },

  getFilteredSuggestions(term) {
    const values = this.state.categories
    const termMatcher = new RegExp(term.split('').join('.*'), 'i')

    return values.map((value) => {
      return {text: value, value: value, isMatch: value.match && !!value.match(termMatcher)}
    })
      .sort((a, b) => { return (a.isMatch === b.isMatch) ? 0 : a.isMatch ? -1 : 1 })
  },

  handleInputChange(e, value) {
    this._setValue(value)
    this.setState({fieldInput: value})
  },

  handleSuggestionSelect(event, item) {
    this._setValue(item.value)
  },

  render() {
    const value = this._getValue()
    return (
      <div className="form-builder__field form-builder__category">
        <label className="form-builder__label">
          {this.props.field.title}
        </label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }


        <div className='form-builder__item'>
          <AutoComplete
            fieldName={this.props.field.name}
            type='text'
            size='20'
            onSelect={this.handleSuggestionSelect}
            onChange={this.handleInputChange}
            defaultValue={value || ''}
            listClass={'mySuggestionList'}
            listHeader={<h3>Suggestions:</h3>}
            suggestions={this.getFilteredSuggestions(this.state.fieldInput)}
          />
        </div>
      </div>
    )
  }
})
