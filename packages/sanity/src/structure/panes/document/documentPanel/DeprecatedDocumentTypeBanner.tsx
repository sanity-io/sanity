import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {ErrorOutlineIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {structureLocaleNamespace} from '../../../i18n'
import {isDeprecatedSchemaType, useTranslation} from 'sanity'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`

export function DeprecatedDocumentTypeBanner() {
  const {schemaType} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)

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
              <Text size={1}>{schemaType.deprecated.reason}</Text>
            </Stack>
          </Box>
        </Flex>
      </Container>
    </Root>
  )
}
