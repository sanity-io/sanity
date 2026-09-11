import {Stack} from '@sanity/ui'
import {lazy, Suspense} from 'react'

import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {type FIXME} from '../../../../FIXME'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {PresenceOverlay} from '../../../../presence/overlay/PresenceOverlay'
import {type InputProps} from '../../../types/inputProps'
import {type BaseImageInputProps} from './types'

// The hotspot/crop editor only renders inside this dialog, so its chunk is fetched on open
// rather than with every image input.
const ImageToolInput = lazy(() =>
  import('../ImageToolInput').then((module) => ({default: module.ImageToolInput})),
)

export function ImageInputHotspotInput(props: {
  handleCloseDialog: () => void
  inputProps: Omit<InputProps, 'renderDefault'>
  imageInputProps: BaseImageInputProps
  isImageToolEnabled: boolean
}) {
  const {handleCloseDialog, inputProps, imageInputProps, isImageToolEnabled} = props
  const {t} = useTranslation()
  const {changed, id, imageUrlBuilder, value} = imageInputProps

  const withImageTool = isImageToolEnabled && value && value.asset
  const imageUrl = value?.asset ? imageUrlBuilder.image(value.asset).url() : ''

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
        <Stack gap={5}>
          {withImageTool && value?.asset && (
            <Suspense fallback={<LoadingBlock />}>
              <ImageToolInput
                {...imageInputProps}
                imageUrl={imageUrl}
                value={value as FIXME}
                presence={inputProps.presence}
                changed={changed}
              />
            </Suspense>
          )}
        </Stack>
      </PresenceOverlay>
    </Dialog>
  )
}
