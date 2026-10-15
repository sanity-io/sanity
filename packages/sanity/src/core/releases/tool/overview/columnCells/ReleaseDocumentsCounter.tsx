import {Text} from 'ui5'

type Props = {
  documentCount: number | undefined
}

export const ReleaseDocumentsCounter = ({documentCount}: Props) => (
  <Text muted size={1} as="div" trim={true}>
    {documentCount || '-'}
  </Text>
)
