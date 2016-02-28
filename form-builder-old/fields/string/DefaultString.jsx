import React from 'react'
import FormBuilderField from '../../FormBuilderFieldMixin'
import FieldErrors from '../../FieldErrors'
import Dispatchable from '../../../../lib/mixins/Dispatchable'
import Completions from './Completions'

export default React.createClass({

  displayName: 'DefaultString',

  mixins: [FormBuilderField, Dispatchable],

  propTypes: {
    className: React.PropTypes.string,
    errors: React.PropTypes.array,
    fieldBuilders: React.PropTypes.object,
    schema: React.PropTypes.object,
    field: React.PropTypes.object
  },

  getInitialState() {
    return {
      autocompleteKey: Math.random().toString(36).substring(2)
    }
  },

  isAutocompleting() {
    return this.props.field.config && !!this.props.field.config.autocomplete
  },

  autocompletionScope() {
    return this.isAutocompleting() ? this.props.field.config.autocomplete.scope : null
  },

  requestAutocompletion(value) {
    // If this field is autocompleting, order completions
    // Debouncing etc. is handled by the AutocompleteStore
    if (this.isAutocompleting()) {
      this.appDispatcher.autocomplete(this.state.autocompleteKey,
        this.autocompletionScope(), value)
    }
  },

  handleChange(e) {
    this._setValue(e.target.value)
    this.requestAutocompletion(e.target.value)
  },

  focus() {
    this.refs.input.focus()
  },

  actions: {
    AUTOCOMPLETE_RESULT({key, scope, spec, completions}) {
      if (key == this.state.autocompleteKey) {
        this.setState({completions, selectedCompletion: -1})
      }
    }
  },

  selectNextCompletion() {
    if (this.state.completions) {
      this.setState({selectedCompletion: Math.min(
              this.state.selectedCompletion + 1,
              this.state.completions.length - 1
            )})
    }
  },

  selectPreviousCompletion() {
    if (this.state.completions) {
      this.setState({selectedCompletion: Math.max(
              this.state.selectedCompletion - 1,
              -1
            )})
    }
  },

  clearCompletions() {
    this.setState({completions: null, selectedCompletion: null})
  },

  currentCompletion() {
    if (this.state.completions && this.state.completions[this.state.selectedCompletion]) {
      return this.state.completions[this.state.selectedCompletion]
    } else {
      return null
    }
  },

  useSelectedCompletion() {
    if (this.currentCompletion()) {
      this._setValue(this.currentCompletion())
      this.clearCompletions()
    }
  },

  onKeyDown(e) {
    const code = e.keyCode
    switch (code) {
      case 13:
        this.useSelectedCompletion()
        break
      case 40:
        this.selectNextCompletion()
        break
      case 38:
        this.selectPreviousCompletion()
        break
      case 27:
        this.clearCompletions()
        break
      default:
        // noop
        break
    }
  },

  handleSelect(text, i) {
    this._setValue(text)
    this.clearCompletions()
  },

  render() {
    const {field, className = []} = this.props

    return (
      <div className="form-builder__field form-builder__string form-builder__string--default">

        <label className="form-builder__label form-builder__label--default">
          {field.title}
        </label>

        {
          field.description &&
            <div className='form-builder__help-text'>{field.description}</div>
        }

        <div className='form-builder__item'>
          <input {...this.props}
            type='text'
            ref='input'
            placeholder={field.placeholder}
            className={className + ' form-control'}
            defaultValue={field.defaultValue}
            onKeyDown={this.onKeyDown}
            onChange={this.handleChange}/>
          {this.state.completions &&
            <Completions completions={this.state.completions}
              selected={this.state.selectedCompletion}
              onSelect={this.handleSelect}/> }
        </div>

        <FieldErrors errors={this.props.errors}/>

      </div>
    )
  }
})
