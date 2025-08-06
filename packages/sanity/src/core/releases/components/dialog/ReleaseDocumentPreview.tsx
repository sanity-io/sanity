import {type BadgeTone, Flex, Text} from '@sanity/ui'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../hooks/useSchema'
import {Preview} from '../../../preview/components/Preview'
import {ReleaseAvatar} from '../ReleaseAvatar'

interface ReleaseDocumentPreviewProps {
  documentId?: string
  documentType?: string
  schemaTypeName?: string
  tone: BadgeTone
  title: string
  showDocument?: boolean
}

export function ReleaseDocumentPreview(props: ReleaseDocumentPreviewProps): React.JSX.Element {
  const {documentId, documentType, schemaTypeName, tone, title, showDocument = true} = props
  const schema = useSchema()
  const schemaType = schema.get(documentType || schemaTypeName || '')

  return (
    <Flex align="center" padding={4} paddingTop={1} justify="space-between">
      {showDocument && (
        <>
          {schemaType && documentId ? (
            <Preview value={{_id: documentId}} schemaType={schemaType} />
          ) : schemaType ? (
            <Preview
              value={{
                _type: schemaType.name,
                title: `New ${schemaType.title || schemaType.name}`,
              }}
              schemaType={schemaType}
            />
          ) : (
            <LoadingBlock />
          )}
        </>
      )}

      <Flex
        align="center"
        gap={2}
        padding={1}
        paddingRight={2}
        style={{
          borderRadius: 999,
          border: '1px solid var(--card-border-color)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <ReleaseAvatar padding={1} tone={tone} />
        <Text size={1} title={title}>
          {title}
        </Text>
      </Flex>
    </Flex>
  )
}
