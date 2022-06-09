import React, {useCallback, useMemo, useState} from 'react'
import {Dialog, Grid, Button, Flex, Box, Tooltip, Spinner, Text} from '@sanity/ui'
import styled from 'styled-components'
import {ComposeIcon} from '@sanity/icons'
import {DefaultPreview} from '../../../components/previews'
import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {TemplatePermissionsResult, useTemplatePermissions} from '../../../datastores'
import {IntentLink} from '../../../router'
import {useSource} from '../../source'
import {useColorScheme} from '../../colorScheme'

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

export function NewDocumentButton() {
  const [newDocumentButtonEl, setNewDocumentButtonEl] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState<boolean>(false)

  const {scheme} = useColorScheme()

  const {
    __internal: {staticInitialValueTemplateItems},
    currentUser,
  } = useSource()

  const [permissions, loading] = useTemplatePermissions({
    templateItems: staticInitialValueTemplateItems,
  })

  const keyedPermissions = useMemo(() => {
    if (!permissions) return {}
    return permissions.reduce<Record<string, TemplatePermissionsResult>>((acc, next) => {
      acc[next.id] = next
      return acc
    }, {})
  }, [permissions])

  const hasNewDocumentOptions = staticInitialValueTemplateItems.length > 0

  const canCreateDocument = staticInitialValueTemplateItems.some(
    (t) => keyedPermissions[t.id]?.granted
  )

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
              {staticInitialValueTemplateItems.map((template) => {
                if (keyedPermissions[template.id]?.granted) {
                  return (
                    <DocumentButton
                      forwardedAs={IntentLink}
                      intent="create"
                      key={template.id}
                      mode="ghost"
                      onClick={handleLinkClick}
                      padding={2}
                      params={{template: template.templateId, type: template.schemaType}}
                    >
                      <DefaultPreview
                        media={template.icon}
                        subtitle={template.subtitle}
                        title={template.title}
                      />
                    </DocumentButton>
                  )
                }

                return (
                  <Tooltip
                    key={template.id}
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
                      <DocumentButton key={template.id} mode="ghost" padding={2} disabled>
                        <DefaultPreview
                          media={template.icon}
                          subtitle={template.subtitle}
                          title={template.title}
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
