import {Box, Code} from '@sanity/ui'
import {type TypeNode} from 'groq-js'
import {type TFunction} from 'sanity'
import styled from 'styled-components'

import {StyledLabel} from './VisionGui.styled'

export const QueryTypesWrapper = styled(Box)`
  height: 100%;
  width: 30%;
  min-width: 300px;
  @media screen and (max-width: 700px) {
    display: none !important;
  }
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

export function QueryTypesContainer(props: {
  typeNode?: TypeNode
  t: TFunction<'vision', undefined>
}) {
  if (!props.typeNode) {
    return null
  }

  return (
    <QueryTypesWrapper paddingY={3}>
      <TypesContainer>
        <StyledLabel muted>{props.t('types.label')}</StyledLabel>
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
