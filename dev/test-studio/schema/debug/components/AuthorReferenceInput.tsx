import {createImageUrlBuilder} from '@sanity/image-url'
import {type Reference, type ReferenceSchemaType} from '@sanity/types'
import {Button, Spinner} from '@sanity/ui'
import {
  type RefObject,
  Suspense,
  use,
  useImperativeHandle,
  useMemo,
  useRef,
  type RefAttributes,
} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {type ObjectInputProps, set, setIfMissing, unset, useClient} from 'sanity'

import styles from './AuthorReferenceInput.module.css'

const noop = () => null

interface AuthorReference {
  _id: string
  image: any
  name: string
}

export function AuthorReferenceInput(
  props: ObjectInputProps<Reference, ReferenceSchemaType> & RefAttributes<any>,
) {
  const {ref, schemaType, value, readOnly} = props
  const client = useClient({apiVersion: '2022-09-09'})
  const current = value && value._ref
  const imageBuilder = createImageUrlBuilder(client)

  const inputRef = useRef<HTMLButtonElement | null>(null)

  const authors$ = useMemo(
    () =>
      client.observable.fetch<AuthorReference[]>(
        // Select authors, with a defined image, which are published
        '*[_type == "author" && defined(image) && _id in path("*")][0...10] {_id, image, name}',
      ),
    [client],
  )

  const authorsPromise = useObservablePromise(authors$)

  const handleChange = (item: AuthorReference) => {
    // Are we selecting the same value as previously selected?
    if (props.value && props.value._ref === item._id) {
      // Clear the current value
      handleClear()
      return
    }

    props.onChange([
      // A reference is an object, so we need to initialize it before attempting to set subproperties
      setIfMissing({_type: schemaType.name, _ref: item._id}),

      // Allow setting weak reference in schema options
      schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']),

      // Set the actual reference value
      set(item._id, ['_ref']),
    ])
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
      <Suspense fallback={<Spinner />}>
        <AuthorOptions
          authorsPromise={authorsPromise}
          current={current}
          imageBuilder={imageBuilder}
          inputRef={inputRef}
          onSelect={readOnly ? noop : handleChange}
        />
      </Suspense>
    </div>
  )
}

function AuthorOptions({
  authorsPromise,
  current,
  imageBuilder,
  inputRef,
  onSelect,
}: {
  authorsPromise: ObservablePromise<AuthorReference[]>
  current: string | undefined
  imageBuilder: ReturnType<typeof createImageUrlBuilder>
  inputRef: RefObject<HTMLButtonElement | null>
  onSelect: (item: AuthorReference) => void
}) {
  const authors = use(authorsPromise)

  return (
    <>
      {authors.map((author, i) => (
        <Button
          key={author._id}
          ref={i === 0 ? inputRef : undefined}
          type="button"
          // className={current === author._id ? styles.activeButton : styles.button}
          onClick={() => onSelect(author)}
          selected={current === author._id}
        >
          <img
            className={styles.authorImage}
            title={author.name}
            alt={`${author.name || 'Author'}.`}
            src={imageBuilder.image(author.image).width(150).height(150).fit('crop').url()}
          />
        </Button>
      ))}
    </>
  )
}
