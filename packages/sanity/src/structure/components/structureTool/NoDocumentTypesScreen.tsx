import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card, Container, Stack, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {Flex, Box} from 'ui5'

import {structureLocaleNamespace} from '../../i18n'

export function NoDocumentTypesScreen() {
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Card height="fill">
      <Flex alignItems="center" height="100%" justifyContent="center" padding={4}>
        <Container width={0}>
          <Card padding={4} radius={2} shadow={1} tone="caution">
            <Flex>
              <Box>
                <Text size={1}>
                  <WarningOutlineIcon />
                </Text>
              </Box>
              <Stack flex={1} marginLeft={3} gap={3}>
                <Text as="h1" size={1} weight="medium">
                  {t('no-document-types-screen.title')}
                </Text>
                <Text as="p" muted size={1}>
                  {t('no-document-types-screen.subtitle')}
                </Text>
                <Text as="p" muted size={1}>
                  <a
                    href="https://www.sanity.io/docs/create-a-schema-and-configure-sanity-studio"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('no-document-types-screen.link-text')}
                  </a>
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
