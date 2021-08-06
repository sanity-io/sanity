import React from 'react'
import {LinkIcon} from '@sanity/icons'
import {Box, Text, Dialog, Grid, Card, Heading} from '@sanity/ui'
import styled from 'styled-components'
import {Asset as AssetType} from '@sanity/types'
import Preview from '../../Preview'
import {schema, WithReferringDocuments} from '../../legacyParts'

import {SpinnerWithText} from '../../components/SpinnerWithText'
import {IntentLink} from '../../transitional/IntentLink'

interface Props {
  asset: AssetType
  onClose: () => void
  error: Error
}

const DocumentLink = styled(IntentLink)`
  color: inherit;
  text-decoration: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export function DeleteAssetErrorDialog({asset, onClose, error}: Props) {
  return (
    <Dialog id="asset-dialog" header="Image could not be deleted" width={2} onClose={onClose}>
      <Card padding={4} tone="critical">
        <Grid gap={2} style={{gridTemplateColumns: 'max-content 1fr'}}>
          <Box padding={2}>
            <img
              src={`${asset.url}?w=200`}
              style={{maxWidth: '200px'}}
              alt="The image that is in use by the listed documents"
            />
          </Box>
          <Box paddingX={4}>
            <WithReferringDocuments id={asset._id}>
              {({isLoading, referringDocuments}) => {
                const drafts = referringDocuments.reduce(
                  (acc, doc) =>
                    doc._id.startsWith('drafts.') ? acc.concat(doc._id.slice(7)) : acc,
                  []
                )

                const filteredDocuments = referringDocuments.filter(
                  (doc) => !drafts.includes(doc._id)
                )

                if (isLoading) {
                  return <SpinnerWithText text="Loading..." />
                }
                if (filteredDocuments.length === 0) {
                  return <Text as="p">Could not delete image: {error.message}</Text>
                }
                return (
                  <>
                    <Heading as="h4" size={1}>
                      {filteredDocuments.length > 1 ? (
                        <>{filteredDocuments.length} documents are using this image</>
                      ) : (
                        <>One document is using this image</>
                      )}
                    </Heading>
                    <Box marginY={4}>
                      <Text as="p">
                        Open the document{referringDocuments.length > 1 ? 's' : ''} and remove or
                        replace the image before deleting it.
                      </Text>
                    </Box>
                    <Grid gap={2}>
                      {filteredDocuments.map((doc) => (
                        <Box key={doc._id}>
                          <DocumentLink intent="edit" params={{id: doc._id}} key={doc._id}>
                            <Box flex={1}>
                              <Preview value={doc} type={schema.get(doc._type)} />
                            </Box>
                            <Box>
                              <Text>
                                <LinkIcon /> Open
                              </Text>
                            </Box>
                          </DocumentLink>
                        </Box>
                      ))}
                    </Grid>
                  </>
                )
              }}
            </WithReferringDocuments>
          </Box>
        </Grid>
      </Card>
    </Dialog>
  )
}
