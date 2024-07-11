/* eslint-disable react/jsx-no-bind */
import {ArrowDownIcon, ArrowUpIcon, SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Dispatch, type SetStateAction} from 'react'

import {type DocumentSort} from './types'

export function DocumentHeader(props: {
  setSort: Dispatch<SetStateAction<DocumentSort>>
  sort: DocumentSort
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
}) {
  const {setSort, sort, searchTerm, setSearchTerm} = props

  const sortIcon = sort.order === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <Card radius={3}>
      <Flex>
        <Stack flex={1} paddingY={2} paddingRight={3}>
          <TextInput
            border={false}
            fontSize={1}
            icon={SearchIcon}
            placeholder="Search documents"
            radius={3}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
        </Stack>

        {/* Created */}
        <Flex paddingY={3} sizing="border" style={{width: 130}}>
          <Button
            iconRight={sort.property === '_createdAt' ? sortIcon : undefined}
            mode="bleed"
            onClick={() =>
              setSort((s) => {
                if (s.property === '_createdAt') {
                  return {...s, order: s.order === 'asc' ? 'desc' : 'asc'}
                }

                return {property: '_createdAt', order: 'desc'}
              })
            }
            padding={2}
            radius={3}
            space={1}
            text="Created"
          />
        </Flex>

        {/* Updated */}
        <Flex paddingY={3} sizing="border" style={{width: 130}}>
          <Button
            iconRight={sort.property === '_updatedAt' ? sortIcon : undefined}
            mode="bleed"
            onClick={() =>
              setSort((s) => {
                if (s.property === '_updatedAt') {
                  return {...s, order: s.order === 'asc' ? 'desc' : 'asc'}
                }

                return {property: '_updatedAt', order: 'desc'}
              })
            }
            padding={2}
            radius={3}
            space={1}
            text="Edited"
          />
        </Flex>

        {/* Published */}
        <Flex paddingY={3} sizing="border" style={{width: 130}}>
          <Button
            iconRight={sort.property === '_publishedAt' ? sortIcon : undefined}
            mode="bleed"
            onClick={() =>
              setSort((s) => {
                if (s.property === '_publishedAt') {
                  return {...s, order: s.order === 'asc' ? 'desc' : 'asc'}
                }

                return {property: '_publishedAt', order: 'desc'}
              })
            }
            padding={2}
            radius={3}
            space={1}
            text="Published"
          />
        </Flex>

        {/* Contributors */}
        <Flex paddingY={3} sizing="border" style={{width: 100}}>
          <Box padding={2}>
            <Text muted size={1} weight="medium">
              Contributors
            </Text>
          </Box>
        </Flex>

        {/* Status */}
        <Flex paddingY={3} sizing="border" style={{width: 60}}>
          <Box padding={2}>
            <Text muted size={1} weight="medium">
              Status
            </Text>
          </Box>
        </Flex>

        <Flex paddingY={3} sizing="border" style={{width: 49}}>
          <Box padding={2}>
            <Text muted size={1} weight="medium">
              &nbsp;
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Card>
  )
}
