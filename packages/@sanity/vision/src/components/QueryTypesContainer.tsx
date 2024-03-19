import {Box, Button, Code, Inline} from '@sanity/ui'
import {type TypeNode} from 'groq-js'
import {useCallback, useEffect, useState} from 'react'
import {type TFunction} from 'sanity'
import styled from 'styled-components'

import {type LocalStorageish} from '../util/localStorage'
import {QueryTypesPopover} from './QueryTypesPopover'
import {StyledLabel} from './VisionGui.styled'

export const QueryTypesWrapper = styled(Box)`
  height: 100%;
  width: 30%;
  min-width: 300px;
  border-left: 1px solid var(--card-border-color);
  @media screen and (max-width: 700px) {
    display: none !important;
  }
`
export const CollapsedTypesWrapper = styled(Box)`
  height: 100%;
  border-left: 1px solid var(--card-border-color);
  @media screen and (max-width: 700px) {
    display: none !important;
  }
`

export const ToggleTypesButton = styled(Button)`
  writing-mode: vertical-lr;
`

export const TypesContainer = styled(Box)`
  height: 100%;
  width: 100%;
  overflow: auto;
`

export const LangContainer = styled(Box)`
  height: 40px;
  width: 100%;
  overflow: auto;
`

const localStorageKey = 'vision.show-types'
export function QueryTypesContainer(props: {
  typeNode?: TypeNode
  localStorage: LocalStorageish
  t: TFunction<'vision', undefined>
}): JSX.Element | null {
  const [showTypes, setShowTypes] = useState(
    props.localStorage.get<boolean>(localStorageKey, false) === true,
  )
  const toggleTypes = useCallback(() => {
    setShowTypes((v) => v === false)
  }, [])

  useEffect(() => {
    props.localStorage.set(localStorageKey, showTypes)
  }, [showTypes, props.localStorage])
  if (!props.typeNode) {
    return null
  }

  if (!showTypes) {
    return (
      <CollapsedTypesWrapper padding={2} paddingY={3}>
        <ToggleTypesButton
          mode="ghost"
          padding={1}
          fontSize={1}
          onClick={toggleTypes}
          aria-label={props.t('types.show-types-button-label')}
        >
          {props.t('types.show-types')}
        </ToggleTypesButton>
      </CollapsedTypesWrapper>
    )
  }

  return (
    <QueryTypesWrapper paddingY={3} display="flex">
      <Box paddingX={2}>
        <ToggleTypesButton
          mode="ghost"
          padding={1}
          fontSize={1}
          onClick={toggleTypes}
          aria-label={props.t('types.hide-types-button-label')}
        >
          {props.t('types.hide-types')}
        </ToggleTypesButton>
      </Box>
      <TypesContainer paddingX={2}>
        <Inline space={1}>
          <Box>
            <StyledLabel muted>{props.t('types.label')}</StyledLabel>
          </Box>

          <Box>
            <QueryTypesPopover t={props.t} />
          </Box>
        </Inline>
        <Box paddingY={3}>
          <Code language="typescript" cellPadding={2}>
            {generateTypescript(props.typeNode)}
          </Code>
        </Box>
      </TypesContainer>
    </QueryTypesWrapper>
  )
}

function generateTypescript(typeNode: TypeNode, indent: number = 0): string {
  const indentStr = (i: number) => '  '.repeat(i + 0)
  switch (typeNode.type) {
    case 'union': {
      return `${typeNode.of.map((node) => generateTypescript(node, indent)).join(' | ')}`
    }
    case 'array': {
      return `${generateTypescript(typeNode.of, indent)}[]`
    }
    case 'object': {
      const fields = Object.entries(typeNode.attributes).map(([key, attribute]) => {
        const modifier = attribute.optional ? '?' : ''
        return `${indentStr(indent + 1)}${key}${modifier}: ${generateTypescript(attribute.value, indent + 1)};`
      })
      return `{\n${fields.join('\n')}\n${indentStr(indent)}}`
    }
    case 'string': {
      if (typeNode.value !== undefined) {
        return `"${typeNode.value}"`
      }
      return typeNode.type
    }
    case 'number':
    case 'boolean': {
      if (typeNode.value !== undefined) {
        return `${typeNode.value}`
      }
      return typeNode.type
    }
    case 'null': {
      return 'null'
    }
    case 'unknown': {
      return 'unknown'
    }
    case 'inline': {
      return typeNode.name
    }
    default: {
      // @ts-expect-error - handle all types
      throw new Error(`Unhandled type: ${typeNode.type}`)
    }
  }
}
