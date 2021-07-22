import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Grid, Spinner, Text} from '@sanity/ui'
import PropTypes from 'prop-types'
import React from 'react'
import enhanceWithReferringDocuments from './enhanceWithReferringDocuments'
import DocTitle from './DocTitle'
import ReferringDocumentsList from './ReferringDocumentsList'

export default enhanceWithReferringDocuments(
  class ConfirmDelete extends React.PureComponent {
    static propTypes = {
      onCancel: PropTypes.func.isRequired,
      onConfirm: PropTypes.func.isRequired,
      published: PropTypes.object,
      draft: PropTypes.object,
      referringDocuments: PropTypes.array,
      isCheckingReferringDocuments: PropTypes.bool,
    }

    render() {
      const {
        isCheckingReferringDocuments,
        referringDocuments,
        draft,
        published,
        onCancel,
        onConfirm,
      } = this.props

      const hasReferringDocuments = referringDocuments.length > 0
      const showConfirmButton = !isCheckingReferringDocuments
      const title = isCheckingReferringDocuments ? 'Checking…' : 'Confirm delete'
      const docTitle = <DocTitle document={draft || published} />

      return (
        <Dialog header={title} id="confirm-delete-dialog" width={1}>
          <Flex direction="column">
            <Box flex={1} overflow="auto" padding={4}>
              {isCheckingReferringDocuments && (
                <Flex align="center" direction="column">
                  <Spinner muted />
                  <Box marginTop={3}>
                    <Text align="center" muted size={1}>
                      Looking for referring documents…
                    </Text>
                  </Box>
                </Flex>
              )}

              {hasReferringDocuments && (
                <>
                  <Card padding={3} radius={2} tone="caution">
                    <Flex>
                      <Text size={1}>
                        <WarningOutlineIcon />
                      </Text>
                      <Box flex={1} marginLeft={3}>
                        <Text size={1}>
                          Warning: Found{' '}
                          {referringDocuments.length === 1 ? (
                            <>a document</>
                          ) : (
                            <>{referringDocuments.length} documents</>
                          )}{' '}
                          that refer{referringDocuments.length === 1 ? <>s</> : ''} to “{docTitle}”.
                        </Text>
                      </Box>
                    </Flex>
                  </Card>

                  <Box marginY={4}>
                    <Text as="p" muted>
                      You may not be able to delete “{docTitle}” because{' '}
                      {referringDocuments.length === 1 ? <>this document</> : <>these documents</>}{' '}
                      refer
                      {referringDocuments.length === 1 ? <>s</> : ''} to it:
                    </Text>
                  </Box>

                  <ReferringDocumentsList documents={referringDocuments} />
                </>
              )}

              {!isCheckingReferringDocuments && !hasReferringDocuments && (
                <Text as="p">
                  Are you sure you want to delete <strong>“{docTitle}”</strong>?
                </Text>
              )}
            </Box>

            <Card borderTop paddingX={4} paddingY={3}>
              <Grid columns={showConfirmButton ? 2 : 1} gap={2}>
                <Button mode="ghost" onClick={onCancel} text="Cancel" />

                {showConfirmButton && (
                  <Button
                    onClick={onConfirm}
                    text={hasReferringDocuments ? 'Delete anyway' : 'Delete now'}
                    tone="critical"
                  />
                )}
              </Grid>
            </Card>
          </Flex>
        </Dialog>
      )
    }
  }
)
