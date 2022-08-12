import PropTypes from 'prop-types'
import React, {useCallback, useRef, useEffect, useState} from 'react'
import {Button, Box, Flex, Card, Stack, Spinner, Text, Grid} from '@sanity/ui'
import {DashboardWidget} from '@sanity/dashboard'
import styled from 'styled-components'
import SanityPreview from 'part:@sanity/base/preview'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {IntentLink} from '@sanity/base/router'
import schema from 'part:@sanity/base/schema'
import {GettingStartedDocs} from './GettingStartedDocs'
import {OverrideVideoGridStyles} from './OverrideVideoGridStyles'
import {getSubscription, assembleQuery} from './sanityConnector'

/**
 * This file contains a custom widget created to list recent documents edited.
 * See https://www.sanity.io/docs/creating-your-own-widget for more info
 */
function DocumentList(props) {
  const [documents, setDocuments] = useState([])
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(true)
  const {
    apiVersion = 'v1',
    title = 'Last created',
    query,
    queryParams,
    types,
    order = '_createdAt desc',
    limit = 10,
  } = props
  const subscriptionRef = useRef()
  const handleDocuments = useCallback(
    (_documents) => {
      setDocuments(_documents.slice(0, limit))
      setIsLoading(false)
    },
    [limit]
  )
  const handleError = useCallback(
    (_error) => {
      setError(_error)
      setIsLoading(false)
    },
    [query]
  )
  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const {assembledQuery, params} = assembleQuery({query, queryParams, types, order, limit})

    if (!assembledQuery) {
      return
    }

    unsubscribe()

    subscriptionRef.current = getSubscription(assembledQuery, params, apiVersion).subscribe({
      next: (_documents) => handleDocuments(_documents),
      error: (_error) => handleError(_error),
    })

    // eslint-disable-next-line consistent-return
    return () => {
      unsubscribe()
    }
  }, [apiVersion, limit, order, query, queryParams, types])

  return (
    <Container columns={[1, 1, 2, 2]} gap={4} marginBottom={5}>
      <GettingStartedDocs />
      <ContentWrapper
        hideFooterBorder
        header={title}
        footer={
          <FooterWrapper padding={3} paddingTop={2} sizing="border" wrap="wrap">
            <Button
              as={IntentLink}
              flex={1}
              paddingX={3}
              paddingY={3}
              mode="default"
              tone="primary"
              text="See all documents"
              intent="open-tool"
              params={{tool: 'desk'}}
            />
          </FooterWrapper>
        }
      >
        <Box paddingX={3} paddingTop={2}>
          <Stack space={0}>
            {!error && documents?.length === 0 && isLoading && (
              <Box padding={2}>
                <Spinner muted />
              </Box>
            )}
            {error && (
              <Box padding={2}>
                <Text as="p">{error.message}</Text>
              </Box>
            )}
            {documents &&
              documents.map((doc) => {
                const type = schema.get(doc._type)
                return (
                  <Card key={doc._id}>
                    <Flex justify="stretch" direction="column">
                      <Button
                        as={IntentLink}
                        intent="edit"
                        mode="bleed"
                        paddingY={2}
                        params={{
                          type: doc._type,
                          id: getPublishedId(doc._id),
                        }}
                      >
                        <SanityPreview layout="default" type={type} value={doc} key={doc._id} />
                      </Button>
                    </Flex>
                  </Card>
                )
              })}
          </Stack>
        </Box>
      </ContentWrapper>
      <OverrideVideoGridStyles />
    </Container>
  )
}

DocumentList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  title: PropTypes.any,
}

DocumentList.defaultProps = {
  title: 'Recent documents',
}

export default {
  name: 'new-document-list',
  component: DocumentList,
}

const Container = styled(Grid)``

const ContentWrapper = styled(DashboardWidget)`
  & > [data-name='content'] {
    height: auto;
    min-height: 10.0625em;
  }
`

const FooterWrapper = styled(Flex)`
  /* This prevents the bottom padding from being swallowed due to a weird flex behaviour - see https://chenhuijing.com/blog/flexbox-and-padding/ */
  &:after {
    content: '';
    padding-bottom: 0;
    display: block;
    width: 100%;
  }
`
