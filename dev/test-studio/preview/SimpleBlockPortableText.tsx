import {PortableText, type PortableTextComponents} from '@portabletext/react'
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

export function SimpleBlockPortableText(): JSX.Element {
  const {data, loading, error} = useQuery<
    {
      _id: string
      title: string | null
      body: PortableTextBlock[]
      notes: {_key: string; title?: string; minutes?: number; notes?: PortableTextBlock[]}[]
    }[]
  >(/* groq */ `*[_type == "simpleBlock"]{_id,title,body,notes}`)

  if (error) {
    throw error
  }

  if (loading) {
    return <p>Loading...</p>
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
