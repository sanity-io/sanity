import PropTypes from 'prop-types'
import React from 'react'
import speakingurl from 'speakingurl'
import {get} from 'lodash'
import Button from 'part:@sanity/components/buttons/default'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import PatchEvent, {set, unset} from '../../PatchEvent'
import withDocument from '../../utils/withDocument'
import styles from './styles/SlugInput.css'

// Fallback slugify function if not defined in field options
function defaultSlugify(value, type) {
  const maxLength = (type.options && type.options.maxLength) || 200
  const slugifyOpts = {truncate: maxLength, symbols: true}
  return value ? speakingurl(value, slugifyOpts) : ''
}

const defaultState = {
  inputText: undefined,
  loading: false
}

export default withDocument(
  class SlugInput extends React.Component {
    static propTypes = {
      type: FormBuilderPropTypes.type.isRequired,
      level: PropTypes.number.isRequired,
      value: PropTypes.shape({
        current: PropTypes.string
      }),
      document: PropTypes.shape({_id: PropTypes.string}).isRequired,
      onChange: PropTypes.func,
      markers: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string.isRequired
        })
      )
    }

    static defaultProps = {
      value: {current: undefined},
      onChange() {},
      markers: []
    }

    state = defaultState

    componentDidMount() {
      this._isMounted = true
    }

    componentWillUnmount() {
      this._isMounted = false
    }

    updateValue(value) {
      if (!value) {
        this.props.onChange(PatchEvent.from(unset()))
        return
      }

      this.props.onChange(
        PatchEvent.from(setIfMissing({_type: this.props.type.name}), set(value, ['current']))
      )
    }

    slugify(sourceValue) {
      if (!sourceValue) {
        return Promise.resolve(sourceValue)
      }

      const {type} = this.props
      const slugify = get(type, 'options.slugify', defaultSlugify)
      return Promise.resolve(slugify(type, sourceValue))
    }

    componentWillReceiveProps(nextProps) {
      const {document} = nextProps

      // Reset state if document is changed
      const oldDocId = this.props.document._id
      const newDocId = document._id
      if (oldDocId !== newDocId) {
        this.setState(defaultState)
      }
    }

    focus() {
      if (this._textInput) {
        this._textInput.focus()
      }
    }

    setTextInput = input => {
      this._textInput = input
    }

    handleChange = event => {
      this.updateValue(event.target.value.toString())
    }

    handleGenerateSlug = () => {
      const {type, document} = this.props
      const source = get(type, 'options.source')

      if (!source) {
        // eslint-disable-next-line no-console
        console.error(`Source is missing. Check source on type "${type.name}" in schema`)
        return
      }

      const newFromSource = typeof source === 'function' ? source(document) : get(document, source)
      this.setState({loading: true})
      this.slugify(newFromSource || '')
        .then(newSlug => this.updateValue(newSlug))
        .catch(err => {
          // eslint-disable-next-line no-console
          console.error(`An error occured while slugifying "${newFromSource}":\n${err.stack}`)
        })
        .then(() => this._isMounted && this.setState({loading: false}))
    }

    render() {
      const {value, type, level, markers, document, ...rest} = this.props
      const {loading, inputText} = this.state

      const hasSourceField = type.options && type.options.source
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
          <div className={styles.wrapper}>
            <div className={styles.input}>
              <TextInput
                {...rest}
                ref={this.setTextInput}
                customValidity={errors.length > 0 ? errors[0].item.message : ''}
                disabled={loading}
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
        </FormField>
      )
    }
  }
)
