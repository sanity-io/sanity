import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {stegaClean} from '@sanity/client/stega'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
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
      _type: string
      slug: {current?: string | null} | null
      title: string | null
      bodyString: string
      body: PortableTextBlock[]
      notes: {_key: string; title?: string; minutes?: number; notes?: PortableTextBlock[]}[]
    }[]
  >(
    /* groq */ `*[_type == "simpleBlock"] | order(_updatedAt desc)[0..10]{_id,_type,slug,title,"bodyString":pt::text(body),body,notes}`,
  )

  if (error) {
    throw error
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <>
      {data?.map((item) => {
        const dataAttribute = createDataAttribute({id: item._id, type: item._type})
        return (
          <article
            key={item._id}
            data-sanity={dataAttribute.scope('slug').toString()}
            style={{
              margin: '10px 20px',
              background: 'ghostwhite',
              borderRadius: '8px',
              border: '1px solid lightgray',
              padding: '10px 20px',
            }}
          >
            <h1>{item.title || 'Untitled'}</h1>
            {item.slug?.current && (
              <p data-sanity={dataAttribute.scope('slug.current').toString()}>
                slug: {stegaClean(item.slug.current)}
              </p>
            )}
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
