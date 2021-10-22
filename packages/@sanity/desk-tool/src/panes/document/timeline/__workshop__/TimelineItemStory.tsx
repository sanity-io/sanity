import {Card, Container, Flex, LayerProvider, Menu} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import {TimelineItem} from '../timelineItem'

const STATE_OPTIONS = {
  enabled: 'enabled',
  disabled: 'disabled',
  active: 'active',
}

const StyledMenu = styled(Menu)`
  & > [data-ui='Stack'] {
    grid-gap: 0;
    & > [data-ui='MenuItem']:first-child {
      & [data-ui='IconTimelineFlex'] {
        &:after {
          display: none;
        }
      }
    }

    & > [data-ui='MenuItem']:last-child {
      & [data-ui='IconTimelineFlex'] {
        &:before {
          display: none;
        }
      }
    }
  }
`

const TYPES = ['create', 'editDraft', 'delete', 'publish', 'unpublish', 'discardDraft', 'editLive']

export default function TimelineItemStory() {
  const state = useSelect('state', STATE_OPTIONS, 'enabled')
  const withinSelection = useBoolean('withinSelection', false) || false
  const isSelectionTop = 2
  const isSelectionBottom = 5

  const getState = useCallback(
    (index: number) => {
      if (
        index > isSelectionTop &&
        index < isSelectionBottom &&
        withinSelection &&
        state !== 'disabled'
      ) {
        return 'withinSelection'
      }

      return state
    },
    [state, withinSelection]
  )

  return (
    <Card height="fill" padding={4}>
      <Flex align="center" height="fill" justify="center">
        <Container width={0}>
          <LayerProvider>
            <StyledMenu>
              {TYPES.map((type, index) => {
                return (
                  <TimelineItem
                    key={type}
                    chunk={{
                      index: index,
                      id: 'id',
                      type: type as any,
                      start: 1,
                      end: 2,
                      startTimestamp: '',
                      endTimestamp: '',
                      authors: new Set(['']),
                      draftState: 'present',
                      publishedState: 'present',
                    }}
                    isSelectionTop={index === isSelectionTop && withinSelection}
                    isSelectionBottom={index === isSelectionBottom && withinSelection}
                    state={getState(index) as any}
                    type={type as any}
                    onSelect={() => '' as any}
                    timestamp=""
                  />
                )
              })}
            </StyledMenu>
          </LayerProvider>
        </Container>
      </Flex>
    </Card>
  )
}
