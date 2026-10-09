// The dialog chrome moved to the generic federated asset-source module (it is
// shared by the generic dialog shell and the Media Library's own dialogs);
// re-exported here so the iframe dialogs keep their local import. Only
// AppDialog is re-exported: the full-surface variant is used solely by the
// generic dialog shell.
export {AppDialog} from '../../federatedAssetSource/Dialog'
