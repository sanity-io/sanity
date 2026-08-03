import {createImageUrlBuilder} from '@sanity/image-url'
import {type Reference, type ReferenceSchemaType} from '@sanity/types'
import {Button, Spinner} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useImperativeHandle, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {map, startWith} from 'rxjs/operators'
import {type ObjectInputProps, set, setIfMissing, unset, useClient} from 'sanity'

import styles from './AuthorReferenceInput.module.css'

const noop = () => null

interface AuthorReference {
  _id: string
  image: any
  name: string
}

const INITIAL_STATE = {loading: true, authors: [] as AuthorReference[]}

export const AuthorReferenceInput = forwardRef(function AuthorReferenceInput(
  props: ObjectInputProps<Reference, ReferenceSchemaType>,
  ref: ForwardedRef<any>,
) {
  // @ts-expect-error -- pre-existing, fix later
  const {inputProps, type, value} = props
  const {readOnly} = inputProps
  const client = useClient({apiVersion: '2022-09-09'})
  const current = value && value._ref
  const imageBuilder = createImageUrlBuilder(client)

  const inputRef = useRef<HTMLButtonElement | null>(null)

  const state$ = useMemo(
    () =>
      client.observable
        .fetch(
          // Select authors, with a defined image, which are published
          '*[_type == "author" && defined(image) && _id in path("*")][0...10] {_id, image, name}',
        )
        .pipe(
          map((authors: AuthorReference[]) => ({loading: false, authors})),
          startWith(INITIAL_STATE),
        ),
    [client],
  )

  const {loading, authors} = useObservable(state$, INITIAL_STATE)

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
      // @ts-expect-error -- pre-existing, fix later
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
            key={author._id}
            ref={i === 0 ? inputRef : undefined}
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
