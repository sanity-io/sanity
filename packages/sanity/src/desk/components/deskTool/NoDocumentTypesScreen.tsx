import i18n from 'i18next'
import k from './../../../i18n/keys'
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'

export function NoDocumentTypesScreen() {
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
                  {i18n.t(k.NO_DOCUMENT_TYPES)}
                </Text>
                <Text as="p" muted size={1}>
                  {i18n.t(k.PLEASE_DEFINE_AT_LEAST_ONE_DOC)}
                </Text>
                <Text as="p" muted size={1}>
                  <a
                    href="https://beta.sanity.io/docs/platform/studio/config"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {i18n.t(k.LEARN_HOW_TO_ADD_A_DOCUMENT_TY)}
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
