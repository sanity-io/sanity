import {Text} from '@sanity/ui'

type Props = {
  documentCount: number | undefined
}

export const ReleaseDocumentsCounter = ({documentCount}: Props) => (
  <Text muted size={1}>
    {documentCount || '-'}
  </Text>
)
