// @flow
import PropTypes from 'prop-types'
import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import {deburr, kebabCase, get} from 'lodash'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import PatchEvent, {set, unset} from '../../PatchEvent'
import styles from './styles/SlugInput.css'

// Fallback slugify function if not defined in factory function
// or in the type definition's options
function defaultSlugify(value) {
  return kebabCase(deburr(value))
}

function proposeNewValue(value) {
  const arr = value.split('-')

  const version = Number(arr.slice(-1)[0])

  if (version && Number.isInteger(version)) {
    arr[arr.length - 1] = version + 1
    return arr.join('-')
  }

  return `${value}-1`
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
    document: PropTypes.shape({_id: PropTypes.string}).isRequired,
    onChange: PropTypes.func,
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired
      })
    )
  }

  static defaultProps = {
    checkValidityFn: null,
    value: {current: undefined, auto: true},
    onChange() {},
    slugifyFn: defaultSlugify,
    markers: []
  }

  state = vanillaState

  updateValue(value) {
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  slugify(sourceValue) {
    if (!sourceValue) {
      return sourceValue
    }
    const {type, slugifyFn} = this.props

    const slugify = get(type, 'options.slugifyFn') || slugifyFn

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

  focus() {
    if (this._textInput) {
      this._textInput.focus()
    }
  }

  setTextInput = (input: ?TextInput) => {
    this._textInput = input
  }

  handleChange = event => {
    this.updateValue({current: event.target.value.toString()})
  }

  handleGenerateSlug = () => {
    const {type, checkValidityFn, document} = this.props
    const source = get(type, 'options.source')

    if (!source) {
      console.error(`Source is missing. Check source on type "${type.name}" in schema`) // eslint-disable-line no-console
      return
    }
    const newFromSource = typeof source === 'function' ? source(document) : get(document, source)
    const newCurrent = this.slugify(newFromSource)

    this.slugProposal = this.slugProposal || newCurrent
    this.setState({loading: true})

    checkValidityFn(type, this.slugProposal, document && document._id).then(error => {
      if (error) {
        console.log(this.slugProposal, 'is used')
        this.slugProposal = proposeNewValue(this.slugProposal)
        this.handleGenerateSlug() // Keep trying
      } else {
        this.setState({
          loading: false
        })
        this.updateValue({current: this.slugProposal})
        this.slugProposal = null
      }
    })
  }

  render() {
    const {value, type, level, markers, document, checkValidityFn, slugifyFn, ...rest} = this.props
    const hasSourceField = type.options && type.options.source
    const {loading, validationError, inputText} = this.state
    const formFieldProps = {
      label: type.title,
      description: type.description,
      level: level,
      markers
    }

    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')

    return (
      <FormField {...formFieldProps}>
        {validationError && <p>{validationError}</p>}
        <div className={styles.wrapper}>
          <div className={styles.input}>
            <TextInput
              ref={this.setTextInput}
              customValidity={errors.length > 0 ? errors[0].item.message : ''}
              disabled={loading}
              placeholder={type.placeholder}
              onChange={this.handleChange}
              value={typeof inputText === 'string' ? inputText : value.current}
              {...rest}
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
      </FormField>
    )
  }
}
