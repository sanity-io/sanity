import React from 'react'
import PropTypes from 'prop-types'
import imageUrlBuilder from '@sanity/image-url'
import client from 'part:@sanity/base/client'
import Spinner from 'part:@sanity/components/loading/spinner'
import FormField from 'part:@sanity/components/formfields/default'
import {PatchEvent, set, unset, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import styles from './AuthorReferenceInput.css'

const noop = () => null
const imageBuilder = imageUrlBuilder(client)

export default class AuthorReferenceInput extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
    }).isRequired,

    value: PropTypes.shape({
      _ref: PropTypes.string.isRequired,
      _type: PropTypes.string.isRequired,
    }),

    readOnly: PropTypes.bool,
    level: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    readOnly: false,
    value: undefined,
  }

  state = {loading: true, authors: []}

  constructor() {
    super()

    // In a real world scenario, apply some kind of constraint that is not
    // based on whether or not the author has an image, obviously
    this.fetchObservable = client.observable
      .fetch(
        // Select authors, with a defined image, which are published
        '*[_type == "author" && defined(image) && _id in path("*")][0...10] {_id, image, name}'
      )
      .subscribe(this.handleAuthorsReceived)
  }

  componentWillUnmount() {
    this.fetchObservable.unsubscribe()
  }

  handleAuthorsReceived = (authors) => this.setState({authors, loading: false})

  handleChange = (item) => {
    const {type} = this.props

    // Are we selecting the same value as previously selected?
    if (this.props.value && this.props.value._ref === item._id) {
      // Clear the current value
      this.handleClear()
      return
    }

    this.props.onChange(
      PatchEvent.from(
        // A reference is an object, so we need to initialize it before attempting to set subproperties
        setIfMissing({
          _type: type.name,
          _ref: item._id,
        }),

        // Allow setting weak reference in schema options
        type.weak === true ? set(true, ['_weak']) : unset(['_weak']),

        // Set the actual reference value
        set(item._id, ['_ref'])
      )
    )
  }

  handleClear = () => {
    this.props.onChange(PatchEvent.from(unset()))
  }

  setFirstInputRef = (input) => {
    this._input = input
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  render() {
    const {type, value, level, readOnly} = this.props
    const {loading, authors} = this.state

    // What is the currently selected reference?
    const current = value && value._ref

    return (
      <FormField label={type.title} level={level} description={type.description} labelFor="foo">
        <div className={styles.authorGroup}>
          {loading ? (
            <Spinner inline message="Loading authors..." />
          ) : (
            authors.map((author, i) => (
              <button
                ref={i === 0 ? this.setFirstInputRef : undefined}
                key={author._id}
                type="button"
                className={current === author._id ? styles.activeButton : styles.button}
                onClick={readOnly ? noop : () => this.handleChange(author)}
              >
                <img
                  className={styles.authorImage}
                  title={author.name}
                  alt={`${author.name || 'Author'}.`}
                  src={imageBuilder.image(author.image).width(150).height(150).fit('crop').url()}
                />
              </button>
            ))
          )}
        </div>
      </FormField>
    )
  }
}
