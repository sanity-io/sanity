/* eslint-disable no-nested-ternary */
import {IntentButton, InsufficientPermissionsMessage} from '@sanity/base/components'
import {NewDocumentOption} from '@sanity/base/_internal'
import {Box, Flex, Stack, Tooltip, Text, Button} from '@sanity/ui'
import React from 'react'
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
  currentUser: unknown
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
  const content = (
    <Root>
      <Flex align={description ? 'flex-start' : 'center'}>
        <Stack space={3} flex={1}>
          <Text as="h2" style={{whiteSpace: 'break-spaces'}}>
            {title}
          </Text>

          {subtitle && (
            <Text size={1} as="p" textOverflow="ellipsis">
              {subtitle}
            </Text>
          )}

          {description && (
            <Text as="p" size={1} style={{whiteSpace: 'break-spaces'}}>
              {description}
            </Text>
          )}
        </Stack>

        {icon && (
          <Text size={1}>
            <Flex align="flex-start" paddingLeft={2}>
              {typeof icon === 'function' ? (
                React.createElement(icon)
              ) : typeof icon === 'string' ? (
                <span>{icon}</span>
              ) : React.isValidElement(icon) ? (
                icon
              ) : null}
            </Flex>
          </Text>
        )}
      </Flex>
    </Root>
  )

  if (granted) {
    return (
      <StyledIntentButton
        intent="create"
        params={[{type: template.schemaType, template: template.id}, parameters]}
        title={subtitle ? `Create new ${title} (${subtitle})` : `Create new ${title}`}
        onClick={onClick}
        mode="ghost"
        fontSize={2}
        data-testid={`create-document-item-${template.id}`}
      >
        {content}
      </StyledIntentButton>
    )
  }

  return (
    <Tooltip
      content={
        <Box padding={2} style={{maxWidth: 300}}>
          <InsufficientPermissionsMessage
            currentUser={currentUser}
            operationLabel="create this document"
          />
        </Box>
      }
    >
      <DisabledButtonWrapper>
        <StyledButton aria-label="insufficient permissions" mode="ghost" disabled>
          {content}
        </StyledButton>
      </DisabledButtonWrapper>
    </Tooltip>
  )
}
