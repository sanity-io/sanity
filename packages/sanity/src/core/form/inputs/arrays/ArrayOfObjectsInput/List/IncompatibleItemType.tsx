import {BulbOutlineIcon, UnknownIcon} from '@sanity/icons'
import {Box, Card, Code, Flex, Stack, Text, type Theme, useClickOutsideEvent} from '@sanity/ui'
import {resolveTypeName} from '@sanity/util/content'
import {type FocusEvent, useCallback, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Popover} from '../../../../../../ui-components'
import {Translate, useTranslation} from '../../../../../i18n'

const PopoverCard = styled(Card)`
  max-width: ${({theme}: {theme: Theme}) => theme.sanity.container[1]}px;
`

interface Props {
  value: unknown
  onFocus?: (event: FocusEvent) => void
  vertical?: boolean
}

export function IncompatibleItemType(props: Props) {
  const {value, onFocus, vertical, ...rest} = props
  const [showDetails, setShowDetails] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const {t} = useTranslation()

  useClickOutsideEvent(
    () => setShowDetails(false),
    () => [popoverRef.current],
  )

  const handleKeyDown = useCallback((e: any) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      setShowDetails(false)
    }
  }, [])

  const handleShowDetails = useCallback(() => {
    setShowDetails((v) => !v)
  }, [])

  const typeName = resolveTypeName(value)
  return (
    <Popover
      open={showDetails}
      ref={popoverRef}
      onKeyDown={handleKeyDown}
      portal
      constrainSize
      tone="default"
      content={
        <PopoverCard margin={1} padding={3} onKeyDown={handleKeyDown} tabIndex={0} overflow="auto">
          <Stack space={4}>
            <Box>
              <Text weight="medium">{t('inputs.array.error.type-is-incompatible-title')}</Text>
            </Box>
            <Text size={1}>
              <Translate
                t={t}
                i18nKey="inputs.array.error.current-schema-not-declare-description"
                values={{typeName}}
              />
            </Text>
            <Box>
              <Text size={1}>
                <BulbOutlineIcon /> {t('inputs.array.error.can-delete-but-no-edit-description')}
              </Text>
            </Box>
            <Stack space={2}>
              <Text size={1} weight="medium">
                {t('inputs.array.error.json-representation-description')}
              </Text>
              <Card padding={2} overflow="auto" border>
                <Code size={1} as="pre" language="json">
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Card>
            </Stack>
          </Stack>
        </PopoverCard>
      }
    >
      <Card
        as="button"
        type="button"
        radius={2}
        tone="inherit"
        paddingX={2}
        paddingY={3}
        flex={1}
        onFocus={onFocus}
        onClick={handleShowDetails}
        onKeyDown={handleKeyDown}
        __unstable_focusRing
        {...rest}
      >
        <Flex align="center">
          <Box marginRight={3}>
            <Text>
              <UnknownIcon />
            </Text>
          </Box>

          <Box flex={1}>
            <Text size={1} textOverflow="ellipsis">
              <Translate
                t={t}
                i18nKey="inputs.array.error.type-is-incompatible-prompt"
                values={{typeName}}
              />
            </Text>
          </Box>
        </Flex>
      </Card>
    </Popover>
  )
}
