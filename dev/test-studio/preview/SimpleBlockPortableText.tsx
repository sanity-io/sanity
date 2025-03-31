import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {Flex, Spinner} from '@sanity/ui'
import {type PortableTextBlock} from 'sanity'

import {imageBuilder, useQuery} from './loader'

const components: PortableTextComponents = {
  types: {
    image: ({value}) => {
      if (!value?.asset?._ref) {
        return null
      }
      return (
        <img
          alt={value.alt || ''}
          src={imageBuilder.image(value).width(150).height(150).fit('crop').url()}
        />
      )
    },
  },
}

export function SimpleBlockPortableText(): React.JSX.Element {
  const {data, loading, error} = useQuery<
    {
      _id: string
      title: string | null
      bodyString: string
      body: PortableTextBlock[]
      notes: {_key: string; title?: string; minutes?: number; notes?: PortableTextBlock[]}[]
    }[]
  >(
    /* groq */ `*[_type == "simpleBlock"] | order(_updatedAt desc)[0..10]{_id,title,"bodyString":pt::text(body),body,notes}`,
  )

  if (error) {
    throw error
  }

  if (loading) {
    return (
      <Flex
        align="center"
        direction="column"
        height="fill"
        justify="center"
        style={{width: '100%'}}
      >
        <Spinner />
      </Flex>
    )
  }

  return (
    <>
      {data?.map((item) => {
        return (
          <article
            key={item._id}
            style={{
              margin: '10px 20px',
              background: 'ghostwhite',
              borderRadius: '8px',
              border: '1px solid lightgray',
              padding: '10px 20px',
            }}
          >
            <h1>{item.title || 'Untitled'}</h1>
            <p>{item.bodyString}</p>
            <PortableText components={components} value={item.body} />
            {item.notes?.map((note) => (
              <div key={note._key}>
                <h2>{note.title}</h2>
                <p>{note.minutes} minutes</p>
                <PortableText components={components} value={note.notes || []} />
              </div>
            ))}
          </article>
        )
      })}
    </>
  )
}
