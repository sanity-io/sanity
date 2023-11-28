import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import {structureLocaleNamespace} from '../../i18n'
import {useTranslation} from 'sanity'

export function NoDocumentTypesScreen() {
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={0}>
          <Card padding={4} radius={2} shadow={1} tone="caution">
            <Flex>
              <Box>
                <Text size={1}>
                  <WarningOutlineIcon />
                </Text>
              </Box>
              <Stack flex={1} marginLeft={3} space={3}>
                <Text as="h1" size={1} weight="bold">
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
