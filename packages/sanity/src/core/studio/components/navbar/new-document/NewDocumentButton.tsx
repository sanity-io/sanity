import React, {useCallback, useMemo, useState} from 'react'
import {Dialog, Grid, Button, Flex, Box, Tooltip, Spinner, Text} from '@sanity/ui'
import styled from 'styled-components'
import {ComposeIcon, DocumentIcon} from '@sanity/icons'
import {useColorScheme} from '../../../colorScheme'
import {useCurrentUser} from '../../../../store'
import {DefaultPreview, InsufficientPermissionsMessage} from '../../../../components'
import {NewDocumentProps} from '../../../../config'
import {IntentLink} from 'sanity/router'

const DocumentButton = styled(Button)`
  text-decoration: none;
`

const TooltipContentBox = styled(Box)`
  max-width: 300px;
`

const DisabledButtonWrapper = styled.div`
  & > * {
    width: 100%;
  }
`

const DefaultIcon = () => <DocumentIcon />

export function NewDocumentButton(props: NewDocumentProps) {
  const {canCreateDocument, loading, options} = props
  const [newDocumentButtonEl, setNewDocumentButtonEl] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState<boolean>(false)
  const {scheme} = useColorScheme()
  const currentUser = useCurrentUser()
  const hasNewDocumentOptions = options.length > 0

  const tooltipContent = useMemo(() => {
    if (!hasNewDocumentOptions) {
      return <Text size={1}>No document types</Text>
    }

    if (canCreateDocument) {
      return <Text size={1}>New document...</Text>
    }

    return (
      <InsufficientPermissionsMessage
        currentUser={currentUser}
        operationLabel="create any document"
      />
    )
  }, [canCreateDocument, currentUser, hasNewDocumentOptions])

  const handleOpen = useCallback(() => {
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    newDocumentButtonEl?.focus()
  }, [newDocumentButtonEl])

  const handleLinkClick = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <>
      <Tooltip
        content={<TooltipContentBox padding={2}>{tooltipContent}</TooltipContentBox>}
        disabled={loading}
        placement="bottom"
        portal
        scheme={scheme}
      >
        <Box>
          <Button
            aria-label="New document…"
            disabled={!canCreateDocument || !hasNewDocumentOptions || loading}
            icon={ComposeIcon}
            mode="bleed"
            onClick={handleOpen}
            ref={setNewDocumentButtonEl}
            style={{
              cursor: !canCreateDocument || !hasNewDocumentOptions ? 'not-allowed' : undefined,
            }}
          />
        </Box>
      </Tooltip>

      {open && (
        <Dialog
          header="New document"
          id="new-document-dialog"
          onClickOutside={handleClose}
          onClose={handleClose}
          scheme={scheme}
          width={2}
        >
          {loading && (
            <Flex padding={4} align="center" justify="center">
              <Spinner muted aria-label="Loading…" />
            </Flex>
          )}

          {!loading && (
            <Grid padding={4} columns={[1, 1, 2, 3]} gap={3}>
              {options.map((option) => {
                if (option?.hasPermission) {
                  return (
                    <DocumentButton
                      forwardedAs={IntentLink}
                      intent="create"
                      key={option.id}
                      mode="ghost"
                      onClick={handleLinkClick}
                      padding={2}
                      params={{template: option.templateId, type: option.schemaType}}
                    >
                      <DefaultPreview
                        media={option.icon || DefaultIcon}
                        subtitle={option.subtitle}
                        title={option.title}
                      />
                    </DocumentButton>
                  )
                }

                return (
                  <Tooltip
                    key={option.id}
                    content={
                      <TooltipContentBox padding={2}>
                        <InsufficientPermissionsMessage
                          currentUser={currentUser}
                          operationLabel="create this document"
                        />
                      </TooltipContentBox>
                    }
                  >
                    {/* this wrapper is required for the tooltip to show up */}
                    <DisabledButtonWrapper>
                      <DocumentButton key={option.id} mode="ghost" padding={2} disabled>
                        <DefaultPreview
                          media={option.icon}
                          subtitle={option.subtitle}
                          title={option.title}
                        />
                      </DocumentButton>
                    </DisabledButtonWrapper>
                  </Tooltip>
                )
              })}
            </Grid>
          )}
        </Dialog>
      )}
    </>
  )
}
