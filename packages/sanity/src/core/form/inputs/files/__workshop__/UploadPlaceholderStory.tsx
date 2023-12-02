import {Card, Container, Flex} from '@sanity/ui'
import React from 'react'
import {UploadPlaceholder} from '../common/UploadPlaceholder'
import {Button} from '../../../../../ui'

export default function UploadPlaceholderStory() {
  return (
    <Flex align="center" height="fill" justify="center" padding={3}>
      <Container width={1}>
        <Card>
          <UploadPlaceholder
            accept="image/*"
            acceptedFiles={[{name: 'foo.jpg', type: 'image/jpeg'}]}
            browse={<Button text="Browse btn" mode="ghost" />}
            directUploads
            hoveringFiles={[{name: 'foo.jpg', type: 'image/jpeg'}]}
            onUpload={() => null}
            readOnly={false}
            rejectedFilesCount={0}
            type="image"
          />
        </Card>
      </Container>
    </Flex>
  )
}
