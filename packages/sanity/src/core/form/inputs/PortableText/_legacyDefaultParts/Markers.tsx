import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type FormNodeValidation} from '@sanity/types'
import {Flex, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {Box} from 'ui5'

import {type PortableTextMarker, type RenderCustomMarkers} from '../../../types/_transitional'
import {useFormBuilder} from '../../../useFormBuilder'
import {errorFgColorVar, iconText, infoFgColorVar, warningFgColorVar} from './Markers.css'

export interface MarkersProps {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  markers: PortableTextMarker[]
  validation: FormNodeValidation[]
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  renderCustomMarkers?: RenderCustomMarkers
}

const getIcon = (level: 'error' | 'warning' | 'info') => {
  if (level === 'error') {
    return <ErrorOutlineIcon />
  }

  if (level === 'warning') {
    return <WarningOutlineIcon />
  }

  return <InfoOutlineIcon />
}

function IconText(props: ComponentProps<typeof Text>) {
  const {className, style, ...rest} = props
  const {color} = useThemeV2()

  return (
    <Text
      {...rest}
      className={clsx(iconText, className)}
      style={{
        ...assignInlineVars({
          [infoFgColorVar]: color.button.ghost.primary.enabled.fg,
          [warningFgColorVar]: color.button.ghost.caution.enabled.fg,
          [errorFgColorVar]: color.button.ghost.critical.enabled.fg,
        }),
        ...style,
      }}
    />
  )
}

export function DefaultMarkers(props: MarkersProps) {
  const {markers, validation, renderCustomMarkers} = props
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {CustomMarkers} = useFormBuilder().__internal.components

  if (markers.length === 0 && validation.length === 0) {
    return null
  }

  return (
    <Stack gap={1}>
      {validation.length > 0 &&
        validation.map(({message, level}, index) => (
          <Flex key={`validationItem-${index}`}>
            <Box marginRight={2} marginBottom={index + 1 === validation.length ? 0 : 2}>
              <IconText
                size={1}
                data-error={level === 'error' ? '' : undefined}
                data-warning={level === 'warning' ? '' : undefined}
                data-info={level === 'info' ? '' : undefined}
              >
                {getIcon(level)}
              </IconText>
            </Box>
            <Box>
              <Text size={1}>{message || 'Error'}</Text>
            </Box>
          </Flex>
        ))}

      {markers.length > 0 && (
        <Box marginTop={validation.length > 0 ? 3 : 0}>
          {renderCustomMarkers && renderCustomMarkers(markers)}
          {!renderCustomMarkers && <CustomMarkers markers={markers} />}
        </Box>
      )}
    </Stack>
  )
}
