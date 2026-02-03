import {type SchemaType} from '@sanity/types'

// import {PortableTextInputProps} from 'sanity/index'
import {type FIXME} from '../../../../FIXME'
import {
  type FileLike,
  type ResolvedUploader,
  type UploaderResolver,
} from '../../../studio/uploads/types'

export function getUploadCandidates(
  types: SchemaType[],
  resolveUploader: UploaderResolver<FIXME>,
  file: FileLike,
) {
  return types
    .map((memberType) => ({
      type: memberType,
      uploader: resolveUploader(memberType, file),
      parentType: memberType,
    }))
    .filter((member) => member.uploader) as ResolvedUploader[]
}
