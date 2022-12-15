import i18n from 'i18next'
import k from './../../i18n/keys'
import React from 'react'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {WarningOutlineIcon} from '@sanity/icons'
import {useSource} from 'sanity'

export function MissingDocumentTypesMessage() {
  const {name: sourceName} = useSource()

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
                  {i18n.t(k.NO_SCHEMA_TYPES_IN_THE)} <em>{sourceName}</em> {i18n.t(k.SOURCE)}
                </Text>
                <Text as="p" muted size={1}>
                  {i18n.t(k.PLEASE_ADD_SCHEMA_TYPES_IN_YOU)}
                </Text>
                <Text as="p" muted size={1}>
                  <a
                    href="https://beta.sanity.io/docs/platform/studio/config"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {i18n.t(k.LEARN_HOW_TO_ADD_A_SCHEMA_TYPE)}
                  </a>
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Container>
      </Flex>

      {/* <Container>
         <Stack space={5}>
           <Heading as="h1">Empty schema</Heading>
            <Text as="p">
             Your schema does not contain any document types. If it did, those types would be listed
             here.{' '}
             <a
               title="Schema documentation"
               target="_blank"
               rel="noopener noreferrer"
               href="https://www.sanity.io/docs/content-studio/the-schema"
             >
               Read more about how to add schema types
             </a>
             .
           </Text>
         </Stack>
        </Container> */}
    </Card>
  )
}
