import React from 'react'
import {uniqueId} from 'lodash'
import speakingurl from 'speakingurl'
import {
  Path,
  SanityDocument,
  SlugParent,
  SlugifierFn,
  SlugSchemaType,
  Marker,
  isValidationErrorMarker,
} from '@sanity/types'
import {ChangeIndicatorCompareValueProvider} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import * as PathUtils from '@sanity/util/paths'
import Button from 'part:@sanity/components/buttons/default'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import {PatchEvent, set, setIfMissing, unset} from '../../PatchEvent'
import withDocument from '../../utils/withDocument'
import withValuePath from '../../utils/withValuePath'
import styles from './styles/SlugInput.css'

// Fallback slugify function if not defined in field options
const defaultSlugify: SlugifierFn = (value, type) => {
  const maxLength = (type.options && type.options.maxLength) || 200
  const slugifyOpts = {truncate: maxLength, symbols: true}
  return value ? speakingurl(value, slugifyOpts) : ''
}

const defaultState = {
  inputText: undefined,
  loading: false,
}

interface Slug {
  _type: 'slug'
  current?: string
}

type Props = {
  type: SlugSchemaType
  level: number
  value?: Slug
  compareValue?: Slug
  focusPath: Path
  readOnly?: boolean
  document: SanityDocument
  onChange: (ev: PatchEvent) => void
  onFocus: (path: Path) => void
  getValuePath: () => Path
  markers: Marker[]
  presence: any
}

export default withValuePath(
  withDocument(
    class SlugInput extends React.Component<Props> {
      _textInput: any
      _isMounted: boolean
      _inputId = uniqueId('SlugInput')

      static defaultProps = {
        value: {current: undefined},
        readOnly: false,
        onChange() {},
        markers: [],
      }

      state = defaultState

      componentDidMount() {
        this._isMounted = true
      }

      componentWillUnmount() {
        this._isMounted = false
      }

      updateCurrent(current) {
        const {onChange, type} = this.props
        if (!current) {
          onChange(PatchEvent.from(unset([])))
          return
        }

        onChange(PatchEvent.from(setIfMissing({_type: type.name}), set(current, ['current'])))
      }

      slugify(sourceValue) {
        if (!sourceValue) {
          return Promise.resolve(sourceValue)
        }
        const {type} = this.props
        const slugify = type.options.slugify || defaultSlugify
        return Promise.resolve(slugify(sourceValue, type))
      }

      UNSAFE_componentWillReceiveProps(nextProps) {
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

      setTextInput = (input) => {
        this._textInput = input
      }

      handleChange = (event) => {
        this.updateCurrent(event.target.value)
      }

      handleGenerateSlug = () => {
        const {type} = this.props
        const source = type.options?.source
        if (!source) {
          // eslint-disable-next-line no-console
          console.error(`Source is missing. Check source on type "${type.name}" in schema`)
          return
        }

        this.setState({loading: true})
        this.getNewFromSource()
          .then((newFromSource) => this.slugify(newFromSource || ''))
          .then((newSlug) => this.updateCurrent(newSlug))
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(`An error occured while slugifying:\n${err.message}\n${err.stack}`)
          })
          .then(() => this._isMounted && this.setState({loading: false}))
      }

      hasSource = (): boolean => {
        const {type, document} = this.props
        const source = type.options?.source

        return typeof source === 'function' ? true : Boolean(PathUtils.get(document, source))
      }

      getNewFromSource = (): Promise<string | undefined> => {
        const {getValuePath, type, document} = this.props
        const parentPath = getValuePath().slice(0, -1)
        const parent = PathUtils.get(document, parentPath) as SlugParent
        const source = type.options?.source || ([] as Path)
        return Promise.resolve(
          typeof source === 'function'
            ? source(document, {parentPath, parent})
            : (PathUtils.get(document, source) as string | undefined)
        )
      }

      render() {
        const {value, compareValue, type, level, markers, readOnly, presence} = this.props
        const {loading, inputText} = this.state
        const hasSourceField = type.options && type.options.source
        const formFieldProps = {
          label: type.title,
          description: type.description,
          level: level,
          markers,
          presence,
          labelFor: this._inputId,
        }
        const errors = markers.filter(isValidationErrorMarker)
        return (
          <ChangeIndicatorCompareValueProvider
            value={value?.current}
            compareValue={compareValue?.current}
          >
            <FormField {...formFieldProps}>
              <div className={styles.wrapper}>
                <div className={styles.input}>
                  <TextInput
                    inputId={this._inputId}
                    ref={this.setTextInput}
                    customValidity={errors.length > 0 ? errors[0].item.message : ''}
                    disabled={loading}
                    onChange={this.handleChange}
                    value={typeof inputText === 'string' ? inputText : value.current}
                    readOnly={readOnly}
                  />
                </div>
                {hasSourceField && (
                  <Button
                    className={styles.button}
                    disabled={readOnly || loading || !this.hasSource()}
                    loading={loading}
                    onClick={this.handleGenerateSlug}
                    kind="simple"
                  >
                    Generate
                  </Button>
                )}
              </div>
            </FormField>
          </ChangeIndicatorCompareValueProvider>
        )
      }
    }
  )
)
