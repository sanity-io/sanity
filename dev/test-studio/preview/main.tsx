import React, {Suspense, useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import {enableVisualEditing} from '@sanity/visual-editing'
import {createQueryStore} from '@sanity/react-loader'
import {createClient} from '@sanity/client'
import {PortableText} from '@portabletext/react'

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'playground',
  useCdn: true,
  apiVersion: '2023-02-06',
  stega: {
    enabled: true,
    studioUrl: '/',
    filter: (props) => {
      if (props.sourcePath[0] == 'type') {
        return true
      }
      return props.filterDefault(props)
    },
  },
})

const {useQuery, useLiveMode} = createQueryStore({client})

function Main() {
  return (
    <>
      <AllSchemaTypes />
      <Suspense fallback={null}>
        <VisualEditing />
      </Suspense>
    </>
  )
}

function AllSchemaTypes() {
  const {data, loading, error} = useQuery<any[]>(/* groq */ `*[_type == "allTypes"]`)

  if (error) {
    throw error
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <ol>
      {data?.map((item) => {
        return (
          <li key={item._id}>
            <dl>
              <dt>string</dt>
              <dd>{item.string}</dd>
              <dt>type</dt>
              <dd>{item.type}</dd>
              <dt>text</dt>
              <dd>{item.text}</dd>
              <dt>array</dt>
              <dd>{item.array?.map?.((word: any, i: number) => <span key={i}>{word}</span>)}</dd>
              <dt>blocks</dt>
              <dd>
                <PortableText value={item.blocks} />
              </dd>
            </dl>
          </li>
        )
      })}
    </ol>
  )
}

function VisualEditing() {
  useEffect(() => enableVisualEditing(), [])
  useLiveMode({client})

  return null
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

const root = createRoot(rootEl)
root.render(<Main />)
