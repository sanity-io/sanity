import React from 'react'
import {Card, Text} from '@sanity/ui'
import {DefaultDocumentNodeResolver} from 'sanity/desk'
import {JSONPreviewDocumentView} from '../components/documentViews/jsonPreview'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'author') {
    return S.document().views([
      S.view.form(),
      S.view.component(JSONPreviewDocumentView).title('JSON'),
      S.view.component(function Dummy() {
        return (
          <Card padding={4}>
            <Text>This is just a placeholder, ignore me</Text>
          </Card>
        )
      }),
    ])
  }

  return null
}
