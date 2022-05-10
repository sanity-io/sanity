import React, {useMemo} from 'react'
import {Dialog, Grid, Button, Flex, Box, Tooltip, Spinner} from '@sanity/ui'
import styled from 'styled-components'
import {DefaultPreview} from '../../../components/previews'
import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {TemplatePermissionsResult, useTemplatePermissions} from '../../../datastores'
import {IntentLink} from '../../../router'
import {useSource} from '../../source'

const NewDocumentButton = styled(Button)`
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

interface NewDocumentDialogProps {
  onClose: () => void
}

export function NewDocumentDialog(props: NewDocumentDialogProps) {
  const {onClose} = props
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

  if (loading) {
    return (
      <Dialog header="New document" id="new-document-dialog" onClose={onClose} width={2}>
        <Flex padding={4} align="center" justify="center">
          <Spinner muted aria-label="Loading…" />
        </Flex>
      </Dialog>
    )
  }

  return (
    <Dialog
      header="New document"
      id="new-document-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={2}
    >
      <Grid padding={4} columns={[2, 2, 3, 3]} gap={3}>
        {staticInitialValueTemplateItems.map((template) => {
          if (keyedPermissions[template.id]?.granted) {
            return (
              <NewDocumentButton
                key={template.id}
                mode="ghost"
                padding={2}
                forwardedAs={IntentLink}
                intent="create"
                params={{template: template.id, type: template.schemaType}}
                onClick={onClose}
              >
                <DefaultPreview
                  title={template.title}
                  media={template.icon}
                  subtitle={template.subtitle}
                />
              </NewDocumentButton>
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
                <NewDocumentButton key={template.id} mode="ghost" padding={2} disabled>
                  <DefaultPreview
                    title={template.title}
                    media={template.icon}
                    subtitle={template.subtitle}
                  />
                </NewDocumentButton>
              </DisabledButtonWrapper>
            </Tooltip>
          )
        })}
      </Grid>
    </Dialog>
  )
}
