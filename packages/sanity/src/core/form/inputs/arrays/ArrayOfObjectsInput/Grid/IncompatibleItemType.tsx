import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {UnknownIcon} from '@sanity/icons/Unknown'
import {Card, useClickOutsideEvent, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {resolveTypeName} from '@sanity/util/content'
import {type CSSProperties, type FocusEvent, useCallback, useRef, useState} from 'react'
import {Text, Box, Flex, VStack, type TextProps, Icon} from 'ui5'

import {Popover} from '../../../../../../ui-components/popover/Popover'
import {InlineCode} from '../../../../../i18n/components/InlineCode'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../../i18n/Translate'
import {container1Var, popoverCard} from './IncompatibleItemType.css'

interface Props {
  value: unknown
  onFocus?: (event: FocusEvent) => void
  vertical?: boolean
  tone?: TextProps['tone']
}

export function IncompatibleItemType(props: Props) {
  const {value, onFocus, vertical, tone, ...rest} = props
  const [showDetails, setShowDetails] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const {t} = useTranslation()
  const {container} = useThemeV2()

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
        <Card
          className={popoverCard}
          style={{[container1Var]: `${container[1]}px`} as CSSProperties}
          margin={1}
          padding={3}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          overflow="auto"
        >
          <VStack gap={4}>
            <Box>
              <Text weight="medium" as="div" trim={true}>
                {t('inputs.array.error.type-is-incompatible-title')}
              </Text>
            </Box>
            <Text size={1} as="div" trim={true}>
              <Translate
                t={t}
                i18nKey="inputs.array.error.current-schema-not-declare-description"
                values={{typeName}}
                components={{code: InlineCode}}
              />
            </Text>
            <Box>
              <Text size={1} as="div" trim={true}>
                <Icon
                  size={1}
                  muted
                  icon={BulbOutlineIcon}
                  style={{margin: '-0.375rem', display: 'inline'}}
                />{' '}
                {t('inputs.array.error.can-delete-but-no-edit-description')}
              </Text>
            </Box>
            <VStack gap={2}>
              <Text size={1} weight="medium" as="div" trim={true}>
                {t('inputs.array.error.json-representation-description')}
              </Text>
              <Card padding={2} overflow="auto" border>
                <Code size={1} as="pre" language="json">
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Card>
            </VStack>
          </VStack>
        </Card>
      }
    >
      <Card
        as="button"
        type="button"
        radius={2}
        tone="inherit"
        paddingX={2}
        paddingY={3}
        style={{height: '100%'}}
        onFocus={onFocus}
        onClick={handleShowDetails}
        onKeyDown={handleKeyDown}
        __unstable_focusRing
        {...rest}
      >
        <Flex gap={4} marginTop={2} flexDirection="column">
          <Flex margin={1} justifyContent="center">
            <Icon size={4} icon={UnknownIcon} tone={tone} style={{margin: '-0.5625rem'}} />
          </Flex>
          <Text align="center" size={1} as="div" trim={true} tone={tone}>
            <Translate
              t={t}
              i18nKey="inputs.array.error.type-is-incompatible-prompt"
              values={{typeName}}
              components={{code: InlineCode}}
            />
          </Text>
        </Flex>
      </Card>
    </Popover>
  )
}
