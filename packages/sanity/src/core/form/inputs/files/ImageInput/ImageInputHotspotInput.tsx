import {Stack} from '@sanity/ui'

import {Dialog} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {type FIXME} from '../../../../FIXME'
import {useTranslation} from '../../../../i18n'
import {PresenceOverlay} from '../../../../presence'
import {type InputProps} from '../../../types'
import {ImageToolInput} from '../ImageToolInput'
import {type AssetAccessPolicy} from '../types'
import {type BaseImageInputProps} from './types'
import {useImageUrl} from './useImageUrl'

export function ImageInputHotspotInput(props: {
  accessPolicy: AssetAccessPolicy
  handleCloseDialog: () => void
  inputProps: Omit<InputProps, 'renderDefault'>
  imageInputProps: BaseImageInputProps
  isImageToolEnabled: boolean
}) {
  const {accessPolicy, handleCloseDialog, inputProps, imageInputProps, isImageToolEnabled} = props
  const {t} = useTranslation()
  const {changed, id, imageUrlBuilder, value} = imageInputProps

  const {isLoading, url: imageUrl} = useImageUrl({
    accessPolicy,
    imageSource: value?.asset ? value : undefined,
    imageUrlBuilder,
  })

  const withImageTool = isImageToolEnabled && value && value.asset

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
            <>
              {isLoading || !imageUrl ? (
                <LoadingBlock showText />
              ) : (
                <ImageToolInput
                  {...imageInputProps}
                  imageUrl={imageUrl}
                  value={value as FIXME}
                  presence={inputProps.presence}
                  changed={changed}
                />
              )}
            </>
          )}
        </Stack>
      </PresenceOverlay>
    </Dialog>
  )
}
