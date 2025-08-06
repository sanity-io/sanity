import {Box, Card, Flex, Stack, Text} from '@sanity/ui'

import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n'
import {Preview} from '../../../preview/components/Preview'
import {releasesLocaleNamespace} from '../../i18n'

interface DocumentPreviewListProps {
  documentTypes: string[]
}

export function DocumentPreviewList(props: DocumentPreviewListProps): React.JSX.Element {
  const {documentTypes} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const schema = useSchema()

  if (documentTypes.length === 0) {
    return <></>
  }

  return (
    <Box paddingX={5} paddingBottom={3}>
      <Stack space={3}>
        <Stack space={1}>
          <Text as="h4" size={1} weight="semibold">
            {t('template.dialog.documents-to-create.title')}
          </Text>
          <Text muted size={1}>
            {t('template.dialog.documents-to-create.description', {
              count: documentTypes.length,
            })}
          </Text>
        </Stack>

        <Box style={{maxHeight: 200, overflow: 'auto'}}>
          <Stack space={2}>
            {documentTypes.map((typeName) => {
              const schemaType = schema.get(typeName)

              if (!schemaType) {
                return (
                  <Card key={typeName} padding={3} radius={2} tone="caution" border>
                    <Text size={1} muted>
                      {t('template.dialog.documents-to-create.unknown-type', {
                        typeName,
                      })}
                    </Text>
                  </Card>
                )
              }

              return (
                <Card key={typeName} padding={3} radius={2} tone="primary" border>
                  <Flex align="center" gap={3}>
                    <Preview
                      value={{
                        _type: typeName,
                        title: `New ${schemaType.title || typeName}`,
                      }}
                      schemaType={schemaType}
                      layout="default"
                    />
                  </Flex>
                </Card>
              )
            })}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
