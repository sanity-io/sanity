import {isIndexSegment, isKeySegment, ObjectSchemaType, Path, SanityDocument, SchemaType, ValidationMarker, type FormNodeValidation} from '@sanity/types'
import {Box, Card, CardTone, ErrorBoundary, Flex, type Placement, Stack, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components'
import {useListFormat} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {StatusIcon} from './ValidationStatusIcon'
import { toString } from '@sanity/util/paths'
import { EllipsisHorizontalIcon, EnterRightIcon, ErrorOutlineIcon, IconComponent, InfoOutlineIcon, ListIcon, TiersIcon, UlistIcon, WarningOutlineIcon } from '@sanity/icons'
import { useCallback, useState, ErrorInfo, useMemo, Fragment } from 'react'
import { getPathTitles } from '../../../../structure/panes/document/inspectors/validation/getPathTitles'
import { TextWithTone } from '../../../components'
import { ToneIcon } from '../../../../ui-components/toneIcon/ToneIcon'

const StatusIconWrapper = styled.div`
  left: 8px;
  position: relative;
  width: 25px;
`

/** @internal */
export interface FormFieldValidationStatusProps {
  /**
   *
   * @hidden
   * @beta
   */
  validation?: FormNodeValidation[]
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_showSummary?: boolean
  fontSize?: number
  placement?: Placement
  schemaType: ObjectSchemaType
}

const EMPTY_ARRAY: never[] = []

const StyledStack = styled(Stack)`
  max-width: 200px;
`

/** @internal */
export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const { validation = EMPTY_ARRAY, membersValidation = EMPTY_ARRAY, __unstable_showSummary: showSummary, fontSize, placement, schemaType, value } = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')

  const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info'

  // const rootValidation = validation.filter(({ path }) => path.length === 1)

  const itemsWithIssues = membersValidation.reduce<Set<string | number>>((out, { path }) => {
    const segment = path.at(1)

    if (typeof segment === 'undefined') {
      return out
    }

    if (isKeySegment(segment)) {
      out.add(segment._key)
    }

    if (isIndexSegment(segment) || typeof segment === 'string') {
      out.add(segment)
    }

    return out
  }, new Set())

  return (
    <Tooltip
      content={
        <StyledStack space={3}>
          {showSummary && <FormFieldValidationSummary validation={validation} />}

          {!showSummary && (
            <>
              {validation.map((item, itemIndex) => (
                // oxlint-disable-next-line no-array-index-key
                <FormFieldValidationStatusItem key={itemIndex} validation={item} schemaType={schemaType} value={value} />
              ))}
            </>
          )}
          {!showSummary && itemsWithIssues.size !== 0 && (<Flex>
            <Box marginRight={2} /*marginLeft={4}*/>
              <Text size={1} weight="medium">
                <EnterRightIcon />
                {/*<EllipsisHorizontalIcon />*/}
                {/*<TiersIcon />*/}
                {/*<UlistIcon />*/}
                {/*<ListIcon />*/}
              </Text>
            </Box>
            <Box flex={1}>
              <Text size={1}>Issues in {itemsWithIssues.size} items</Text>
            </Box>
          </Flex>
          )}
        </StyledStack>
      }
      portal
      placement={placement}
      fallbackPlacements={['bottom', 'right', 'left']}
    >
      <StatusIconWrapper>
        <Text size={fontSize} weight="medium">
          <StatusIcon status={status} />
        </Text>
      </StatusIconWrapper>
    </Tooltip>
  )
}

function FormFieldValidationStatusItem(props: {validation: FormNodeValidation}) {
  const { validation, schemaType, value } = props

  // return <ValidationCard marker={validation} onOpen={() =>{}} schemaType={schemaType} value={value} />

  return (
    <Flex>
      <Box marginRight={2}>
        <Text size={1} weight="medium">
          <StatusIcon status={validation.level} />
        </Text>
      </Box>
      <Box flex={1}>
        <Text size={1}>{validation.message}</Text>
      </Box>
    </Flex>
  )
}

function FormFieldValidationSummary({validation}: {validation: FormNodeValidation[]}) {
  const {t} = useTranslation()
  const listFormatter = useListFormat()

  const errorCount = validation.reduce(
    (count, item) => (item.level === 'error' ? count + 1 : count),
    0,
  )
  const warningCount = validation.reduce(
    (count, item) => (item.level === 'warning' ? count + 1 : count),
    0,
  )

  const hasErrors = errorCount > 0
  const hasWarnings = warningCount > 0

  if (!hasErrors && !hasWarnings) {
    return null
  }

  const errorText = hasErrors && t('form.validation.summary.errors-count', {count: errorCount})
  const warningText =
    hasWarnings && t('form.validation.summary.warnings-count', {count: warningCount})

  return errorText && warningText ? (
    <Text size={1}>{listFormatter.format([errorText, warningText])}</Text>
  ) : (
    <Text size={1}>{errorText || warningText}</Text>
  )
}

// const MARKER_ICON: Record<'error' | 'warning' | 'info', IconComponent> = {
//   error: ErrorOutlineIcon,
//   warning: WarningOutlineIcon,
//   info: InfoOutlineIcon,
// }

// const MARKER_TONE: Record<'error' | 'warning' | 'info', CardTone> = {
//   error: 'critical',
//   warning: 'caution',
//   info: 'primary',
// }

// function ValidationCard(props: {
//   marker: ValidationMarker
//   onOpen: (path: Path) => void
//   schemaType: ObjectSchemaType
//   value: Partial<SanityDocument> | null
// }) {
//   const {marker, onOpen, schemaType, value} = props
//   const handleOpen = useCallback(() => onOpen(marker.path), [marker, onOpen])
//   const [errorInfo, setErrorInfo] = useState<{error: Error; info: ErrorInfo} | null>(null)
//   const Icon = MARKER_ICON[marker.level]

//   return (
//     <ErrorBoundary onCatch={setErrorInfo}>
//       {errorInfo && (
//         <Card padding={3} radius={2} tone="critical">
//           <Text size={1}>{errorInfo.error.message}</Text>
//         </Card>
//       )}

//       {!errorInfo && (
//         <Card
//           __unstable_focusRing
//           as="button"
//           onClick={handleOpen}
//           padding={3}
//           radius={2}
//           tone={MARKER_TONE[marker.level]}
//         >
//           <Flex align="flex-start" gap={3}>
//             <Box flex="none">
//               <Text size={1}>
//                 <Icon />
//               </Text>
//             </Box>

//             <Stack flex={1} space={2}>
//               <DocumentNodePathBreadcrumbs
//                 path={marker.path}
//                 schemaType={schemaType}
//                 value={value}
//               />

//               <Text muted size={1}>
//                 {marker.message}
//               </Text>
//             </Stack>
//           </Flex>
//         </Card>
//       )}
//     </ErrorBoundary>
//   )
// }

// function DocumentNodePathBreadcrumbs(props: {
//   path: Path
//   schemaType: SchemaType
//   value: Partial<SanityDocument> | null
// }) {
//   const {path, schemaType, value} = props

//   const pathTitles = useMemo(() => {
//     try {
//       return getPathTitles({path: path.slice(1), schemaType, value})
//     } catch (e) {
//       console.error(e)
//     }
//     return null
//   }, [path, schemaType, value])

//   // if (!pathTitles?.length) return null

//   return (
//     <Text size={1}>
//       {(pathTitles === null || pathTitles.length === 0) && <span style={{fontWeight: 500}}>{schemaType.title || schemaType.name}</span>}
//       {pathTitles?.map((t, i) => (
//         // oxlint-disable-next-line no-array-index-key
//         <Fragment key={i}>
//           {i > 0 && <span style={{color: 'var(--card-muted-fg-color)', opacity: 0.5}}> / </span>}
//           <span style={{fontWeight: 500}}>{t.title || t.name}</span>
//         </Fragment>
//       ))}
//     </Text>
//   )
// }
