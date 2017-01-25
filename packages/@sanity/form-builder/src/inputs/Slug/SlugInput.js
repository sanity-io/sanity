import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import InInputButton from 'part:@sanity/components/buttons/in-input'
import DefaultButton from 'part:@sanity/components/buttons/default'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {uniqueId, debounce} from 'lodash'

function slugify(text, maxLength) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/--+/g, '-')         // Replace multiple - with single -
    .substring(0, maxLength)
}

function tryPromise(fn) {
  return Promise.resolve().then(() => fn())
}

export default class SlugInput extends React.Component {
  static passDocument = true;

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.shape({
      slug: PropTypes.string,
      auto: PropTypes.bool
    }),
    validation: PropTypes.shape({
      messages: PropTypes.array
    }),
    checkValidityFn: PropTypes.func,
    document: PropTypes.object.isRequired,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: {slug: undefined, auto: true},
    onChange() {},
    onEnter() {}
  };

  state = {validationError: null, nonAutoSlug: ''}

  constructor(props) {
    super(props)
    this.updateValueWithUniquenessCheck = debounce(
      this.updateValueWithUniquenessCheck.bind(this),
      500
    )
  }

  updateValue(value) {
    this.props.onChange({
      patch: {
        type: value ? 'set' : 'unset',
        path: [],
        value: value
      }
    })
  }

  updateValueWithUniquenessCheck(value) {
    const {checkValidityFn} = this.props
    this.setState({validationError: null})

    return tryPromise(() => checkValidityFn(value.slug))
      .then(validationError => {
        if (!validationError) {
          this.updateValue(value)
          return
        }
        this.setState({validationError: validationError})
        this.updateValue({slug: undefined, auto: false})
      })
      .catch(err => {
        console.error(err) // eslint-disable-line no-console
        this.setState({validationError: 'Got javascript error trying to validate the slug. See console for more info.'})
        this.updateValue({slug: undefined, auto: false})
      })
  }

  componentWillReceiveProps(nextProps) {
    const {checkValidityFn} = this.props
    const {document, type, value} = nextProps
    const fromSource = document.getAttribute(type.source).get()
    const slug = slugify(fromSource || '', type.maxLength)
    if (value.auto && value.slug !== slug) {
      const newVal = {slug: slug, auto: value.auto}
      if (checkValidityFn) {
        this.updateValueWithUniquenessCheck(newVal)
        return
      }
      this.updateValue(newVal)
    }
  }

  handleChange = event => {
    const {checkValidityFn, value} = this.props
    const slug = event.target.value ? slugify(event.target.value) : undefined
    this.setState({nonAutoSlug: slug})
    const newVal = {slug: slug, auto: value.auto}
    if (checkValidityFn) {
      this.updateValueWithUniquenessCheck(newVal)
      return
    }
    this.updateValue(newVal)
  }

  handleChangeButtonClick = event => {
    const {value} = this.props
    this.setState({nonAutoSlug: this.state.validationError ? '' : value.slug})
    this.updateValue({slug: undefined, auto: false})
  }

  handleAutoButtonClicked = event => {
    const {value} = this.props
    this.updateValue({slug: value.slug, auto: true})
  }

  render() {
    const {value, type, validation, level} = this.props
    const {validationError, nonAutoSlug} = this.state
    const formFieldProps = {
      label: type.title,
      description: type.description,
      validation: validation,
      level: level
    }

    if (value.auto) {
      return (
        <DefaultFormField {...formFieldProps}>
          { validationError && (
            <p>{validationError}</p>
          )}
          { !validationError && (
            <p>
              {value.slug || 'N/A'}
            </p>
          )}
          <DefaultButton onClick={this.handleChangeButtonClick}>
            Change
          </DefaultButton>
        </DefaultFormField>
      )
    }

    const inputId = uniqueId('FormBuilderSlug')
    return (
      <DefaultFormField {...formFieldProps}>
        {validationError}
        <DefaultTextInput
          id={inputId}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          value={nonAutoSlug || value.slug}
        />
        <InInputButton onClick={this.handleAutoButtonClicked}>
          Auto
        </InInputButton>
      </DefaultFormField>
    )
  }
}
