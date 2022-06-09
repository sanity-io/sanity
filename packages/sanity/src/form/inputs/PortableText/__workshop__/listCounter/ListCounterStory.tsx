import {Box, Container, Flex, Stack, Text} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React from 'react'
import styled, {css} from 'styled-components'

interface BlockType {
  level: number
  listItem?: 'bullet' | 'number'
}

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const BULLET_MARKERS = ['●', '○', '■']
const NUMBER_FORMATS = ['number', 'lower-alpha', 'lower-roman']

const FONT_SIZE_OPTIONS = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
}

const SPACE_OPTIONS = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
}

const items: BlockType[] = [
  {level: 0},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'bullet'},
  {level: 1, listItem: 'bullet'},
  {level: 2, listItem: 'bullet'},
  {level: 0, listItem: 'number'},
  {level: 1, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 1, listItem: 'number'},
  {level: 0},
  {level: 0},
  {level: 0, listItem: 'bullet'},
  {level: 1, listItem: 'number'},
  {level: 1, listItem: 'number'},
  {level: 0, listItem: 'bullet'},
  {level: 0, listItem: 'number'},
  {level: 1, listItem: 'number'},
  {level: 2, listItem: 'number'},
  {level: 3, listItem: 'number'},
  {level: 4, listItem: 'number'},
  {level: 5, listItem: 'number'},
  {level: 5, listItem: 'number'},
  {level: 5, listItem: 'number'},
  {level: 5, listItem: 'number'},
  {level: 4, listItem: 'number'},
  {level: 3, listItem: 'number'},
  {level: 2, listItem: 'number'},
  {level: 1, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'number'},
  {level: 0, listItem: 'bullet'},
]

const EditableWrapper = styled(Stack)`
  counter-reset: ${LEVELS.map((l) => `list-level-${l}`).join(' ')};

  &[data-debug] {
    outline: 1px solid cyan;
  }

  ${LEVELS.map((l) => {
    return css`
      & > [data-level='${l}'][data-list-item='number'] {
        counter-increment: list-level-${l};
      }
    `
  })}

  & > [data-list-item='number'] + *:not([data-list-item='number']) {
    counter-reset: ${LEVELS.map((l) => `list-level-${l}`).join(' ')};
  }

  ${LEVELS.slice(1).map((l) => {
    return css`
      & > [data-level='${l}'] + [data-level='${l - 1}'] {
        counter-reset: list-level-${l};
      }
    `
  })}

  & > [data-list-item='bullet'] {
    counter-reset: ${LEVELS.map((l) => `list-level-${l}`).join(' ')};
  }
`

export function ListCounterStory() {
  const debug = useBoolean('Debug', false)
  const fontSize = useSelect('Font size', FONT_SIZE_OPTIONS, 2)
  const space = useSelect('Space', SPACE_OPTIONS, 3)

  return (
    <Flex paddingLeft={6} paddingRight={4} paddingY={[4, 5, 6]}>
      <Container width={1}>
        <EditableWrapper data-debug={debug ? '' : undefined} space={space}>
          {items.map((item, itemIndex) => (
            <Block fontSize={fontSize} index={itemIndex} key={itemIndex} value={item} />
          ))}
        </EditableWrapper>
      </Container>
    </Flex>
  )
}

const BlockRoot = styled.div<{$level: number}>((props) => {
  const {$level} = props

  return css`
    padding-left: ${$level * 32}px;

    [data-debug] & {
      outline: 1px solid rgba(0 0 0 / 0.25);
      outline-offset: -1px;
    }

    &[data-list-item] {
      padding-left: ${32 + $level * 32}px;
    }

    &[data-list-item] > div > [data-prefix] {
      position: absolute;
      margin-left: -4.5rem;
      width: 3.75rem;
      text-align: right;
      box-sizing: border-box;

      [data-debug] & {
        background: rgba(255 0 0 / 0.2);
      }
    }

    &[data-list-item='number'] > div > [data-prefix] {
      width: 4rem;
      font-variant-numeric: tabular-nums;

      & > span:before {
        content: ${`counter(list-level-${$level})`} '.';
        content: ${`counter(list-level-${$level}, ${
            NUMBER_FORMATS[$level % NUMBER_FORMATS.length]
          })`}
          '.';
      }
    }

    &[data-list-item='bullet'] > div > [data-prefix] {
      /* padding-right: 0.25rem; */

      & > span {
        position: relative;
        top: -0.1875em;

        &:before {
          content: '${BULLET_MARKERS[$level % BULLET_MARKERS.length]}';
          font-size: 0.46666em;
        }
      }
    }
  `
})

function Block(props: {fontSize?: number; index: number; value: BlockType}) {
  const {fontSize, index, value} = props

  return (
    <BlockRoot
      $level={value.level || 0}
      data-level={value.level || 0}
      data-list-item={value.listItem}
    >
      <Flex align="flex-start">
        <Text as="span" data-prefix="" size={fontSize} />
        <Box as="span" flex={1}>
          <Text as="span" data-text="" size={fontSize}>
            Block <code>#{index}</code>
            {value.level !== undefined && (
              <>
                , Level <code>#{value.level}</code>
              </>
            )}
          </Text>
        </Box>
      </Flex>
    </BlockRoot>
  )
}
