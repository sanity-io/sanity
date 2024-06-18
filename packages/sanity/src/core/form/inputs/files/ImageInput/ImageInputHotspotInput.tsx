import {Stack} from '@sanity/ui'
import {memo, useMemo} from 'react'

import {Dialog} from '../../../../../ui-components'
import {type FIXME} from '../../../../FIXME'
import {useTranslation} from '../../../../i18n'
import {PresenceOverlay} from '../../../../presence'
import {type InputProps} from '../../../types'
import {ImageToolInput} from '../ImageToolInput'
import {type BaseImageInputProps} from './types'

export const ImageInputHotspotInput = memo(function ImageInputHotspotInputComponent(props: {
  handleCloseDialog: () => void
  inputProps: Omit<InputProps, 'renderDefault'>
  imageInputProps: BaseImageInputProps
  isImageToolEnabled: boolean
}) {
  const {handleCloseDialog, inputProps, imageInputProps, isImageToolEnabled} = props
  const {t} = useTranslation()
  const {changed, id, imageUrlBuilder, value} = imageInputProps

  const withImageTool = isImageToolEnabled && value && value.asset
  const imageUrl = useMemo(
    () => (value?.asset ? imageUrlBuilder.image(value.asset).url() : ''),
    [imageUrlBuilder, value?.asset],
  )

  return (
    <Dialog
      __unstable_autoFocus={false}
      header={t('inputs.image.hotspot-dialog.title')}
      id={`${id}_dialog`}
      onClickOutside={handleCloseDialog}
      onClose={handleCloseDialog}
      width={1}
    >
      <PresenceOverlay>
        <Stack space={5}>
          {withImageTool && value?.asset && (
            <ImageToolInput
              {...imageInputProps}
              imageUrl={imageUrl}
              value={value as FIXME}
              presence={inputProps.presence}
              changed={changed}
            />
          )}
        </Stack>
      </PresenceOverlay>
    </Dialog>
  )
})
