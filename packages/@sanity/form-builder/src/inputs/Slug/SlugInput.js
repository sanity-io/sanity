import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import InInputButton from 'part:@sanity/components/buttons/in-input'
import InInputStyles from 'part:@sanity/components/buttons/in-input-style'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {uniqueId, debounce} from 'lodash'
import Spinner from 'part:@sanity/components/loading/spinner'

// Fallback slugify function if not defined in factory function
// or in the type definition's options
function defaultSlugify(type, text) {
  return (text || '').toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/--+/g, '-')         // Replace multiple - with single -
    .substring(0, type.options.maxLength)
}

function tryPromise(fn) {
  return Promise.resolve().then(() => fn())
}

const vanillaState = {validationError: null, nonAutoSlug: '', loading: false}

export default class SlugInput extends React.Component {
  static passDocument = true;

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.shape({
      current: PropTypes.string,
      auto: PropTypes.bool
    }),
    validation: PropTypes.shape({
      messages: PropTypes.array
    }),
    checkValidityFn: PropTypes.func,
    slugifyFn: PropTypes.func,
    document: PropTypes.object.isRequired,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: {current: undefined, auto: true},
    onChange() {},
    onEnter() {}
  };

  state = vanillaState

  constructor(props) {
    super(props)
    this.updateValueWithUniquenessCheck = debounce(
      this.updateValueWithUniquenessCheck.bind(this),
      500
    )
  }

  updateValue(value) {
    this.setState({loading: false})
    this.props.onChange({
      patch: {
        type: value ? 'set' : 'unset',
        path: [],
        value: value
      }
    })
  }

  updateValueWithUniquenessCheck(value) {
    const {type, checkValidityFn, document} = this.props
    const docId = document.getAttribute('_id').get()
    return tryPromise(() => {
      if (!value.current) {
        this.updateValue(value)
        return Promise.resolve(null)
      }
      return checkValidityFn(type, value.current, docId)
    })
      .then(validationError => {
        if (!validationError) {
          this.updateValue(value)
          return
        }
        const proposedNewCurrent = `${value.current}-1`
        const newVal = {current: proposedNewCurrent, auto: false}
        this.setState({validationError: validationError.toString()})
        this.updateValueWithUniquenessCheck(newVal)
      })
      .catch(err => {
        console.error(err) // eslint-disable-line no-console
        this.setState({
          loading: false,
          validationError: 'Got javascript error trying to validate the slug. '
            + 'See javascript console for more info.'
        })
        this.updateValue({current: value.current, auto: false})
      })
  }

  slugify(text) {
    if (!text) {
      return text
    }
    const {type, slugifyFn} = this.props
    if (type.options.slugifyFn) {
      return type.options.slugifyFn(type, text)
    }
    if (slugifyFn) {
      return this.props.slugifyFn(type, text)
    }
    return defaultSlugify(type, text)
  }

  componentWillReceiveProps(nextProps) {
    const {checkValidityFn} = this.props
    const {document, type, value} = nextProps

    // Reset state if document is changed
    const oldDocId = this.props.document.getAttribute('_id').get()
    const newDocId = document.getAttribute('_id').get()
    if (oldDocId !== newDocId) {
      this.setState(vanillaState)
    }

    const fromSource = document.getAttribute(type.options.source).get()
    const newCurrent = this.slugify(fromSource)
    if (value.auto && value.current !== newCurrent) {
      const newVal = {current: newCurrent, auto: value.auto}
      if (checkValidityFn) {
        this.updateValueWithUniquenessCheck(newVal)
        return
      }
      this.updateValue(newVal)
    }
  }

  handleChange = event => {
    const {checkValidityFn, value} = this.props
    const current = event.target.value ? this.slugify(event.target.value) : undefined
    this.setState({nonAutoSlug: current})
    const newVal = {current: current, auto: value.auto}
    if (checkValidityFn) {
      this.setState({loading: true, validationError: null})
      this.updateValueWithUniquenessCheck(newVal)
      return
    }
    this.updateValue(newVal)
  }

  handleChangeButtonClick = event => {
    const {value} = this.props
    this.setState({nonAutoSlug: this.state.validationError ? '' : value.current})
    this.updateValue({current: value.current, auto: false})
  }

  handleAutoButtonClicked = event => {
    const {value} = this.props
    this.updateValue({slug: value.current, auto: true})
  }

  render() {
    const {value, type, validation, level} = this.props
    const {loading, validationError, nonAutoSlug} = this.state
    const formFieldProps = {
      label: type.title,
      description: type.description,
      validation: validation,
      level: level
    }

    const inputId = uniqueId('FormBuilderSlug')
    return (
      <DefaultFormField {...formFieldProps}>
        { validationError && (
          <p>{validationError}</p>
        )}
        <div className={InInputStyles.wrapper}>
          <DefaultTextInput
            id={inputId}
            disabled={value.auto}
            placeholder={type.placeholder}
            onChange={this.handleChange}
            value={nonAutoSlug || value.current}
          />
          <div className={InInputStyles.container}>
            { loading && (
              <Spinner inline message="Loading…" />
            )}
            {
              value.auto && (
                <InInputButton onClick={this.handleChangeButtonClick}>
                  Edit
                </InInputButton>
              )
            }
            {
              !value.auto && (
                <InInputButton onClick={this.handleAutoButtonClicked}>
                  Auto
                </InInputButton>
              )
            }
          </div>
        </div>
      </DefaultFormField>
    )
  }
}
