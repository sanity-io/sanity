// The dialog chrome moved to the generic federated asset-source module (it is
// shared by the generic dialog shell and the Media Library's own dialogs);
// re-exported here so the iframe dialogs keep their local import.
export {AppDialog, FullSurfaceAppDialog} from '../../federatedAssetSource/Dialog'
