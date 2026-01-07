import {Flex, Spinner} from '@sanity/ui'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {Fragment} from 'react'

import {useQuery} from './loader'

export function InternationalizedArrayTest(): React.JSX.Element {
  const {data, loading, error} = useQuery<
    {
      _id: string
      title: string | null
      titles: {_key: string; value: string}[] | null
    }[]
  >(
    /* groq */ `*[_type == "internationalizedArrayTest"]{_id,"title":title[_key == "en"].value,"titles": title[_key != "en" && defined(value)]{_key,value}}`,
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

  const collator = new Intl.Collator('en')
  const sortedData = data?.sort((a, b) => collator.compare(a.title || '', b.title || ''))

  return (
    <>
      {sortedData?.map((item) => {
        const dataAttribute = createDataAttribute({
          type: 'internationalizedArrayTest',
          id: item._id,
        })
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
            <dl>
              {item.titles?.map(({_key, value}) => (
                <Fragment key={_key}>
                  <dt
                    data-sanity={dataAttribute.scope(['title', {_key}]).toString()}
                    data-sanity-drag-group={item._id}
                  >
                    {displayNames.of(_key)}
                  </dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
            </dl>
          </article>
        )
      })}
    </>
  )
}

const displayNames = new Intl.DisplayNames(['en'], {type: 'language'})
