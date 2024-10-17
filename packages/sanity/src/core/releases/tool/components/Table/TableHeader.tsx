import {ArrowDownIcon, ArrowUpIcon, SearchIcon} from '@sanity/icons'
import {Card, Flex, Stack, TextInput} from '@sanity/ui'

import {Button, type ButtonProps} from '../../../../../ui-components'
import {useTableContext} from './TableProvider'
import {type HeaderProps, type TableHeaderProps} from './types'

const SortHeaderButton = ({
  header,
  text,
}: Omit<ButtonProps, 'text'> &
  HeaderProps & {
    text: string
  }) => {
  const {sort, setSortColumn} = useTableContext()
  const sortIcon = sort?.direction === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <Button
      iconRight={header.sorting && sort?.column === header.id ? sortIcon : undefined}
      onClick={() => setSortColumn(String(header.id))}
      mode="bleed"
      size="default"
      text={text}
    />
  )
}

const TableHeaderSearch = ({
  headerProps,
  searchDisabled,
  placeholder,
}: HeaderProps & {placeholder?: string}) => {
  const {setSearchTerm, searchTerm} = useTableContext()

  return (
    <Stack {...headerProps} flex={1} paddingY={2} paddingRight={3}>
      <TextInput
        border={false}
        fontSize={1}
        icon={SearchIcon}
        placeholder={placeholder || 'Search'}
        radius={3}
        value={searchTerm || ''}
        disabled={searchDisabled}
        onChange={(event) => setSearchTerm(event.currentTarget.value)}
        onClear={() => setSearchTerm('')}
        clearButton={!!searchTerm}
      />
    </Stack>
  )
}

/**
 *
 * @internal
 */
export const TableHeader = ({headers, searchDisabled}: TableHeaderProps) => {
  return (
    <Card as="thead" borderTop borderBottom>
      <Flex
        as="tr"
        style={{
          paddingInline: `max(
          calc((100vw - var(--maxInlineSize)) / 2),
          var(--paddingInline)
        )`,
        }}
      >
        {headers.map(({header: Header, width, id, sorting}) => (
          <Header
            key={String(id)}
            headerProps={{
              as: 'th',
              id: String(id),
              style: {width: width || undefined},
            }}
            header={{id, sorting}}
            searchDisabled={searchDisabled}
          />
        ))}
      </Flex>
    </Card>
  )
}

export const Headers = {
  SortHeaderButton,
  TableHeaderSearch,
}
