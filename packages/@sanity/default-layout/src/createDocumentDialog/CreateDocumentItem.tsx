/* eslint-disable no-nested-ternary */

import {
  IntentButton,
  InsufficientPermissionsMessage,
  TemplatePreview,
} from '@sanity/base/components'
import {NewDocumentOption} from '@sanity/base/_internal'
import {DocumentIcon} from '@sanity/icons'
import {CurrentUser} from '@sanity/types'
import {Box, Tooltip, Button} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'

const Root = styled(Box)`
  height: 100%;

  a {
    color: currentColor;
    text-decoration: none;
  }

  svg[data-sanity-icon] {
    margin: 0;
  }
`

const TooltipContentBox = styled(Box)`
  max-width: 300px;
`

const DisabledButtonWrapper = styled.div`
  height: 100%;
`

const StyledIntentButton = styled(IntentButton)`
  display: flex;
  height: 100%;
  width: 100%;
  align-items: flex-start;
`

const StyledButton = styled(Button)`
  display: flex;
  height: 100%;
  width: 100%;
  align-items: flex-start;
`

interface CreateDocumentItemProps extends NewDocumentOption {
  granted: boolean
  currentUser: CurrentUser
  onClick: () => void
}

export function CreateDocumentItem({
  description,
  granted,
  title,
  subtitle,
  icon,
  template,
  parameters,
  currentUser,
  onClick,
}: CreateDocumentItemProps) {
  const params: [Record<string, any>, Record<string, any>] | undefined = useMemo(
    () => (granted ? [{type: template.schemaType, template: template.id}, parameters] : undefined),
    [granted, parameters, template.id, template.schemaType]
  )

  const children = (
    <Root>
      <TemplatePreview
        description={description}
        media={
          <>
            {typeof icon === 'function' ? (
              React.createElement(icon)
            ) : typeof icon === 'string' ? (
              <span>{icon}</span>
            ) : React.isValidElement(icon) ? (
              icon
            ) : (
              <DocumentIcon />
            )}
          </>
        }
        subtitle={subtitle}
        title={title}
      />
    </Root>
  )

  if (granted) {
    return (
      <StyledIntentButton
        data-testid={`create-document-item-${template.id}`}
        fontSize={2}
        intent="create"
        mode="ghost"
        onClick={onClick}
        params={params}
        title={subtitle ? `Create new ${title} (${subtitle})` : `Create new ${title}`}
      >
        {children}
      </StyledIntentButton>
    )
  }

  return (
    <Tooltip
      content={
        <TooltipContentBox padding={2}>
          <InsufficientPermissionsMessage
            currentUser={currentUser}
            operationLabel="create this document"
          />
        </TooltipContentBox>
      }
    >
      <DisabledButtonWrapper>
        <StyledButton aria-label="insufficient permissions" mode="ghost" disabled>
          {children}
        </StyledButton>
      </DisabledButtonWrapper>
    </Tooltip>
  )
}
