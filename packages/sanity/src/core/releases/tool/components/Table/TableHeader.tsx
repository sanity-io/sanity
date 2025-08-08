import {ArrowUpIcon, SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback, useMemo} from 'react'

import {Button, type ButtonProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useTableContext} from './TableProvider'
import {type HeaderProps, type TableHeaderProps} from './types'

const MotionIcon = motion.create(ArrowUpIcon)

const BasicHeader = ({text}: {text: string}) => (
  <Box padding={2}>
    <Text muted size={1} weight="medium">
      {text}
    </Text>
  </Box>
)

const SortHeaderButton = ({
  header,
  text,
}: Omit<ButtonProps, 'text'> &
  HeaderProps & {
    text: string
  }) => {
  const {sort, setSortColumn} = useTableContext()
  const sortIcon = useMemo(
    () => (
      <MotionIcon
        initial={false}
        animate={{rotate: sort?.direction === 'asc' ? 0 : 180}}
        transition={{duration: 0.25, ease: 'easeInOut'}}
      />
    ),
    [sort?.direction],
  )

  const handleClick = useCallback(
    () => setSortColumn(String(header.id)),
    [header.id, setSortColumn],
  )

  return (
    <Button
      iconRight={header.sorting && sort?.column === header.id ? sortIcon : undefined}
      onClick={handleClick}
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
  searchLoading,
}: HeaderProps & {placeholder?: string; searchLoading?: boolean}) => {
  const {t} = useTranslation()
  const {setSearchTerm, searchTerm} = useTableContext()

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setSearchTerm(event.currentTarget.value)
    },
    [setSearchTerm],
  )
  const handleClear = useCallback(() => {
    setSearchTerm('')
  }, [setSearchTerm])

  return (
    <Stack {...headerProps} flex={1} paddingY={2} paddingRight={3} sizing="border">
      <TextInput
        border={false}
        fontSize={1}
        icon={searchLoading ? <SpinnerIcon /> : SearchIcon}
        placeholder={placeholder || t('search.placeholder')}
        radius={3}
        value={searchTerm || ''}
        disabled={searchDisabled}
        onChange={handleChange}
        onClear={handleClear}
        clearButton={Boolean(searchTerm)}
      />
    </Stack>
  )
}

/**
 *
 * @internal
 */
export const TableHeader = ({headers, searchDisabled, searchLoading}: TableHeaderProps) => {
  return (
    <Card as="thead" borderBottom>
      <Flex
        as="tr"
        style={{
          paddingInline: `max(
          calc((100% - var(--maxInlineSize)) / 2),
          var(--paddingInline)
        )`,
        }}
      >
        {headers.map(({header: Header, style, width, id, sorting}) => {
          if (!Header) return null
          return (
            <Header
              key={String(id)}
              headerProps={{
                as: 'th',
                id: String(id),
                style: {...style, width: width || undefined},
              }}
              header={{id, sorting}}
              searchDisabled={searchDisabled}
              searchLoading={searchLoading}
            />
          )
        })}
      </Flex>
    </Card>
  )
}

export const Headers = {
  SortHeaderButton,
  TableHeaderSearch,
  BasicHeader,
}
