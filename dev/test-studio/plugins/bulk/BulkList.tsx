import React, {useEffect, useState} from 'react'
import {Tool, useClient} from 'sanity'
import {FormView} from '../../../../packages/sanity/src/desk/panes/document/documentPanel/documentViews'
import {DocumentPaneProvider} from '../../../../packages/sanity/src/desk/panes'
import {DeskToolProvider} from '../../../../packages/sanity/src/desk'
import {FormViewHorizontal} from './FormViewHorizontal'

export const BulkList: Tool['component'] = (props) => {
  const [items, setItems] = useState([])
  const client = useClient()

  useEffect(() => {
    client.fetch(`*[_type == 'author']|order(_updatedAt desc)[0...10]{_id}`).then((value) => {
      // eslint-disable-next-line no-console
      console.log('fetched', value)
      setItems(value)
    })
  }, [client])

  const itemProps = items.map((item) => ({
    paneKey: 'abc',
    index: 0,
    itemId: item._id,
    pane: {
      options: {
        id: item._id,
        type: 'author',
      },
    },
  }))

  return (
    <div>
      <DeskToolProvider>
        {itemProps.map((item) => (
          <DocumentPaneProvider {...item} key={item.itemId}>
            <FormViewHorizontal hidden={false} margins={[1, 1, 1, 1]} />
          </DocumentPaneProvider>
        ))}
      </DeskToolProvider>
    </div>
  )
}
