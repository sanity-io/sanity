import {Box, Text} from 'ui5'

import {useTranslation} from '../../i18n/hooks/useTranslation'

export function FilterNoMatches(props: {filter: string}) {
  const {t} = useTranslation()

  return (
    <Box paddingX={3} paddingBottom={2}>
      <Box data-testid="perspective-filter-no-matches" padding={2}>
        <Text muted size={1}>
          {t('navbar.filter.no-matches', {filter: props.filter})}
        </Text>
      </Box>
    </Box>
  )
}
