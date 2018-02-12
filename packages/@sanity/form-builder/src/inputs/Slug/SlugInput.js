import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/SlugInput.css'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {debounce, deburr, kebabCase, get} from 'lodash'
import Spinner from 'part:@sanity/components/loading/spinner'
import PatchEvent, {set, unset} from '../../PatchEvent'

// Fallback slugify function if not defined in factory function
// or in the type definition's options
function defaultSlugify(value) {
  return kebabCase(deburr(value))
}

function tryPromise(fn) {
  return Promise.resolve().then(() => fn())
}

const makeCancelable = promise => {
  let hasCanceled_ = false

  const wrappedPromise = new Promise((resolve, reject) => {
    const cancelError = new Error('Promise was canceled')
    cancelError.isCanceled = true
    promise.then(val => {
      return hasCanceled_ ? reject(cancelError) : resolve(val)
    })
    promise.catch(error => {
      return hasCanceled_ ? reject(cancelError) : reject(error)
    })
  })

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true
    }
  }
}

const vanillaState = {
  inputText: undefined,
  loading: false
}

export default class SlugInput extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.shape({
      current: PropTypes.string,
      auto: PropTypes.bool
    }),
    checkValidityFn: PropTypes.func,
    slugifyFn: PropTypes.func,
    document: PropTypes.object.isRequired,
    onChange: PropTypes.func
  }

  static defaultProps = {
    value: {current: undefined, auto: true},
    onChange() {},
    slugifyFn: defaultSlugify
  }

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
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  updateValueWithUniquenessCheck(value) {
    const {type, checkValidityFn, document} = this.props
    const docId = document._id
    return makeCancelable(
      tryPromise(() => {
        if (!value.current) {
          this.updateValue(value)
          this.setState({loading: false, validationError: null})
          return Promise.resolve()
        }
        this.setState({loading: true, validationError: null})
        return checkValidityFn(type, value.current, docId)
      })
    )
      .promise.then(validationError => {
        if (!validationError) {
          this.updateValue(value)
          this.setState({loading: false, validationError: null})
          return Promise.resolve()
        }
        // TODO: Increment number instead of ending up with slug-1-1-1-1-1-1
        const proposedNewCurrent = `${value.current}-1`
        const newVal = {current: proposedNewCurrent, auto: false}
        this.setState({
          loading: false,
          inputText: proposedNewCurrent
          // TODO only show validation error when manual edit is required
          //validationError: validationError.toString()
        })
        return this.updateValueWithUniquenessCheck(newVal)
      })
      .catch(err => {
        if (err.isCanceled) {
          return null
        }
        console.error(err) // eslint-disable-line no-console
        this.setState({
          loading: false,
          validationError:
            'Got javascript error trying to validate the slug. ' +
            'See javascript console for more info.'
        })
        this.updateValue({current: value.current, auto: false})
        return Promise.resolve()
      })
  }

  slugify(sourceValue) {
    if (!sourceValue) {
      return sourceValue
    }
    const {type, slugifyFn} = this.props

    const slugify = get(type, 'options.slugify') || slugifyFn

    return slugify(type, sourceValue)
  }

  componentWillReceiveProps(nextProps) {
    const {document} = nextProps

    // Reset state if document is changed
    const oldDocId = this.props.document._id
    const newDocId = document._id
    if (oldDocId !== newDocId) {
      this.setState(vanillaState)
    }
  }

  handleChange = event => {
    const {checkValidityFn, value} = this.props
    if (this.finalizeSlugTimeout) {
      clearTimeout(this.finalizeSlugTimeout)
    }
    this.setState({inputText: event.target.value.toString()})
    this.finalizeSlugTimeout = setTimeout(() => {
      const newCurrent =
        typeof this.state.inputText === 'undefined' ? undefined : this.slugify(this.state.inputText)
      this.setState({inputText: newCurrent})
      const newVal = {current: newCurrent, auto: value.auto}
      if (checkValidityFn) {
        this.updateValueWithUniquenessCheck(newVal)
        return
      }
      this.updateValue(newVal)
    }, 500)
  }

  handleGenerateSlug = () => {
    const {type, value, checkValidityFn, document} = this.props
    const source = get(type, 'options.source')

    if (!source) {
      return
    }

    const newFromSource = typeof source === 'function' ? source(document) : get(document, source)
    const newCurrent = this.slugify(newFromSource)

    if (newCurrent && newCurrent !== value.current) {
      const newVal = {current: newCurrent, auto: value.auto}
      if (checkValidityFn) {
        // TODO: generate an unique slug first time instead of show loading, validation errors
        // and invalid slugs until it finds an valid slug
        this.updateValueWithUniquenessCheck(newVal)
        this.setState({inputText: newCurrent})
        return
      }
      this.updateValue(newVal)
    }
  }

  focus() {
    this._input.focus()
  }

  setInput = input => {
    this._input = input
  }

  render() {
    const {value, type, level} = this.props
    const hasSourceField = type.options && type.options.source
    const {loading, validationError, inputText} = this.state
    const formFieldProps = {
      label: type.title,
      description: type.description,
      level: level
    }

    return (
      <DefaultFormField {...formFieldProps}>
        {validationError && <p>{validationError}</p>}
        <div className={styles.wrapper}>
          <div className={styles.input}>
            <DefaultTextInput
              disabled={loading}
              ref={this.setInput}
              placeholder={type.placeholder}
              onChange={this.handleChange}
              value={typeof inputText === 'string' ? inputText : value.current}
            />
          </div>

          <div className={styles.button}>
            {hasSourceField && (
              <Button disabled={loading} loading={loading} onClick={this.handleGenerateSlug}>
                Generate slug
              </Button>
            )}
          </div>
        </div>
      </DefaultFormField>
    )
  }
}
