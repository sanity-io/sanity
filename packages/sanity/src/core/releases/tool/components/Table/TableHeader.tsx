import {ArrowUpIcon, SearchIcon} from '@sanity/icons'
import {Box, Card, Checkbox, Flex, Stack, Text, TextInput, Tooltip} from '@sanity/ui'
import {motion} from 'motion/react'
import {useCallback, useMemo} from 'react'

import {Button, type ButtonProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../../i18n'
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
  const {t} = useTranslation()
  const {setSearchTerm, searchTerm} = useTableContext()

  return (
    <Stack {...headerProps} flex={1} paddingY={2} paddingRight={3} sizing="border">
      <TextInput
        border={false}
        fontSize={1}
        icon={SearchIcon}
        placeholder={placeholder || t('search.placeholder')}
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

function ValidationFilterHeader(props: HeaderProps): React.JSX.Element {
  const {showValidationErrorsOnly, setShowValidationErrorsOnly} = useTableContext()
  const {t} = useTranslation(releasesLocaleNamespace)

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setShowValidationErrorsOnly(event.currentTarget.checked)
    },
    [setShowValidationErrorsOnly],
  )

  return (
    <Flex {...props.headerProps} flex={1} padding={1} justify="center" align="center" sizing="border">
      <Tooltip portal placement="bottom" content={<Text size={1}>{t('table-header.validation-filter-tooltip')}</Text>}>
        <Flex as="label">
          <Checkbox checked={showValidationErrorsOnly} onChange={handleChange} />
        </Flex>
      </Tooltip>
    </Flex>
  )
}

/**
 *
 * @internal
 */
export const TableHeader = ({headers, searchDisabled}: TableHeaderProps) => {
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
        {headers.map(
          ({header: Header, style, width, id, sorting}) =>
            !!Header && (
              <Header
                key={String(id)}
                headerProps={{
                  as: 'th',
                  id: String(id),
                  style: {...style, width: width || undefined},
                }}
                header={{id, sorting}}
                searchDisabled={searchDisabled}
              />
            ),
        )}
      </Flex>
    </Card>
  )
}

export const Headers = {
  SortHeaderButton,
  TableHeaderSearch,
  BasicHeader,
  ValidationFilterHeader,
}
