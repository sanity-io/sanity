import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {ErrorOutlineIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {schemaLocaleNamespace, structureLocaleNamespace} from '../../../i18n'
import {
  DeprecatedProperty,
  DeprecatedSchemaType,
  ObjectSchemaType,
  isDeprecatedSchemaType,
  useTranslation,
} from 'sanity'
import sk from 'date-fns/esm/locale/sk/index.js'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`

// TODO: Move into `banners` dir and adopt `Banner` component.
export function DeprecatedDocumentTypeBanner() {
  const {schemaType} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)
  const deprecationReason = useDeprecationReason(schemaType)

  if (!isDeprecatedSchemaType(schemaType)) {
    return null
  }

  return (
    <Root data-testid="deprecated-document-type-banner" shadow={1} tone="transparent">
      <Container paddingX={4} paddingY={3} sizing="border" width={1}>
        <Flex align="center">
          <Text size={1}>
            <ErrorOutlineIcon />
          </Text>
          <Box marginLeft={3}>
            <Stack space={2}>
              <Text size={1} weight="bold">
                {t('banners.deprecated-document-type-banner.text')}
              </Text>
              <Text size={1}>{deprecationReason}</Text>
            </Stack>
          </Box>
        </Flex>
      </Container>
    </Root>
  )
}

function useDeprecationReason(schemaType?: ObjectSchemaType): string | undefined {
  // function useDeprecationReason<SchemaType extends ObjectSchemaType>(
  const {t} = useTranslation(schemaLocaleNamespace)

  if (!isDeprecatedSchemaType(schemaType)) {
    return
  }

  if (schemaType.deprecated.reason.key) {
    // return t(schemaType.deprecated.reason.key)
  }

  // return schemaType.deprecated.reason.default
}
