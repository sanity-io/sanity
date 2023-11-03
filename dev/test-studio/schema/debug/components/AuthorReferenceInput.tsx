import {ObjectInputProps, set, setIfMissing, unset, useClient} from 'sanity'
import imageUrlBuilder from '@sanity/image-url'
import {Reference, ReferenceSchemaType} from '@sanity/types'
import {
  Spinner,
  // eslint-disable-next-line no-restricted-imports
  Button, // Button with children as an image, not supported by StudioUI
} from '@sanity/ui'
import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react'
import styles from './AuthorReferenceInput.module.css'

const noop = () => null

interface AuthorReference {
  _id: string
  image: any
  name: string
}

export const AuthorReferenceInput = forwardRef(function AuthorReferenceInput(
  props: ObjectInputProps<Reference, ReferenceSchemaType>,
  ref: React.ForwardedRef<any>,
) {
  // @todo fix
  const {inputProps, type, value} = props
  const {readOnly} = inputProps
  const client = useClient({apiVersion: '2022-09-09'})
  const current = value && value._ref
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])

  const inputRef = useRef<HTMLButtonElement | null>(null)

  const [state, setState] = useState<{
    loading: boolean
    authors: AuthorReference[]
  }>({loading: true, authors: []})

  const {loading, authors} = state

  useEffect(() => {
    const sub = client.observable
      .fetch(
        // Select authors, with a defined image, which are published
        '*[_type == "author" && defined(image) && _id in path("*")][0...10] {_id, image, name}',
      )
      .subscribe(handleAuthorsReceived)

    return () => {
      sub.unsubscribe()
    }
  }, [client])

  const handleAuthorsReceived = (_authors: AuthorReference[]) =>
    setState({authors: _authors, loading: false})

  const handleChange = (item: AuthorReference) => {
    // Are we selecting the same value as previously selected?
    if (props.value && props.value._ref === item._id) {
      // Clear the current value
      handleClear()
      return
    }

    props.onChange(
      // A reference is an object, so we need to initialize it before attempting to set subproperties
      setIfMissing({_type: type.name, _ref: item._id}),

      // Allow setting weak reference in schema options
      type.weak === true ? set(true, ['_weak']) : unset(['_weak']),

      // Set the actual reference value
      set(item._id, ['_ref']),
    )
  }

  const handleClear = () => {
    props.onChange(unset())
  }

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <div className={styles.authorGroup}>
      {loading ? (
        <Spinner
        //  message="Loading authors..."
        />
      ) : (
        authors.map((author, i) => (
          <Button
            ref={i === 0 ? inputRef : undefined}
            key={author._id}
            type="button"
            // className={current === author._id ? styles.activeButton : styles.button}
            onClick={readOnly ? noop : () => handleChange(author)}
            selected={current === author._id}
          >
            <img
              className={styles.authorImage}
              title={author.name}
              alt={`${author.name || 'Author'}.`}
              src={imageBuilder.image(author.image).width(150).height(150).fit('crop').url()}
            />
          </Button>
        ))
      )}
    </div>
  )
})
