import React from 'react'
import {LinkIcon, TrashIcon} from '@sanity/icons'
import {Box, Text, Dialog, Grid, Button, Heading} from '@sanity/ui'
import styled from 'styled-components'
import {IntentLink} from '@sanity/base/components'
import Preview from '../../Preview'
import {AssetRecord} from '../../inputs/files/ImageInput/types'
import {schema, WithReferringDocuments} from '../../legacyParts'

import {SpinnerWithText} from '../../components/SpinnerWithText'

interface Props {
  asset: AssetRecord
  onClose: () => void
  onDelete: () => void
}

const DocumentLink = styled(IntentLink)`
  color: inherit;
  text-decoration: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export function AssetUsageDialog({asset, onClose, onDelete}: Props) {
  const footer = (
    <Grid padding={2} gap={2} columns={2}>
      <Button text="Close" onClick={onClose} />
      <Button text="Delete" tone="critical" icon={TrashIcon} onClick={onDelete} />
    </Grid>
  )

  return (
    <Dialog
      id="asset-dialog"
      header="Find usages of image"
      width={2}
      onClose={onClose}
      footer={footer}
    >
      <Box padding={4}>
        <Grid gap={2} style={{gridTemplateColumns: 'max-content 1fr'}}>
          <img
            src={`${asset.url}?w=200`}
            style={{maxWidth: '200px'}}
            alt="The image used by the listed documents"
          />

          <WithReferringDocuments id={asset._id}>
            {({isLoading, referringDocuments}) => {
              const drafts = referringDocuments.reduce(
                (acc, doc) => (doc._id.startsWith('drafts.') ? acc.concat(doc._id.slice(7)) : acc),
                []
              )

              const filteredDocuments = referringDocuments.filter(
                (doc) => !drafts.includes(doc._id)
              )

              if (isLoading) {
                return <SpinnerWithText text="Loading..." />
              }

              return (
                <Box paddingX={4}>
                  {filteredDocuments.length === 0 ? (
                    <Text as="p">
                      This image is not in use by any of the documents in this dataset
                    </Text>
                  ) : (
                    <Heading as="h4" size={1}>
                      This image is in use by the following document
                      {filteredDocuments.length > 1 ? 's' : ''}
                    </Heading>
                  )}

                  <Grid gap={2} marginTop={4}>
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
                </Box>
              )
            }}
          </WithReferringDocuments>
        </Grid>
      </Box>
    </Dialog>
  )
}
