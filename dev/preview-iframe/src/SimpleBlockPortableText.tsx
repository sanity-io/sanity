import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {stegaClean} from '@sanity/client/stega'
import {type PortableTextBlock} from '@sanity/types'
import {Flex, Spinner} from '@sanity/ui'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'

import {imageBuilder, useQuery} from './loader'

// Renders `table` blocks so the Presentation preview exercises overlays
// at container depth. Cell text binds overlays via its stega-encoded
// content; the `data-sanity` attribute on each `<td>` additionally binds
// the element itself, so empty cells stay clickable (stega needs
// rendered text, and an empty cell has none).
function createTableComponent(documentId: string, documentType: string) {
  const dataAttribute = createDataAttribute({id: documentId, type: documentType})
  const TableComponent = ({value}: {value: any}) => (
    <table style={{borderCollapse: 'collapse', margin: '8px 0'}}>
      <tbody>
        {(value.rows ?? []).map((row: any) => (
          <tr key={row._key}>
            {(row.cells ?? []).map((cell: any) => (
              <td
                key={cell._key}
                // Bind the element to the first span's `.text` when the
                // cell has content (the studio resolves text paths into
                // containers; a bare array path selects in the preview but
                // focuses nothing in the form).
                data-sanity={dataAttribute
                  .scope(
                    cell.value?.[0]?.children?.[0]
                      ? `body[_key=="${value._key}"].rows[_key=="${row._key}"].cells[_key=="${cell._key}"].value[_key=="${cell.value[0]._key}"].children[_key=="${cell.value[0].children[0]._key}"].text`
                      : `body[_key=="${value._key}"].rows[_key=="${row._key}"].cells[_key=="${cell._key}"].value`,
                  )
                  .toString()}
                style={{border: '1px solid #ccc', padding: 8}}
              >
                <PortableText components={components} value={cell.value ?? []} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
  return TableComponent
}

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
      slugs: {_key: string; current?: string | null}[]
    }[]
  >(
    /* groq */ `*[_type == "simpleBlock"] | order(_updatedAt desc)[0..10]{_id,_type,slug,title,slugs,"bodyString":pt::text(body),body,notes}`,
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
            <h2>Slugs</h2>
            {item.slugs?.map((slugItem, index) => (
              <div
                key={slugItem._key}
                data-sanity={dataAttribute.scope(`slugs[${index}]`).toString()}
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#f9f9f9',
                  position: 'relative',
                }}
                onClick={(e) => {
                  // Prevent default to avoid any interference
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <p data-sanity={dataAttribute.scope(`slugs[${index}].current`).toString()}>
                  slug: {slugItem.current}
                </p>
              </div>
            ))}
            <p>{item.bodyString}</p>
            <PortableText
              components={{
                ...components,
                types: {...components.types, table: createTableComponent(item._id, item._type)},
              }}
              value={item.body}
            />
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
