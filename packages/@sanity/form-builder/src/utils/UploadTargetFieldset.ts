import {FormFieldSet, FormFieldSetProps} from '../components/FormField'
import {createUploadTarget} from '../inputs/common/UploadTarget/createUploadTarget'

export const UploadTargetFieldset = createUploadTarget<FormFieldSetProps>(FormFieldSet)
