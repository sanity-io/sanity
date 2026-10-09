// The picker-mode uploader is generic (the mounted source component does the
// actual upload work), so it lives with the shared federated module; this
// alias keeps the Media Library sources' established name.
export {PickerModeUploader as MediaLibraryUploader} from '../federatedAssetSource/uploader'
