// Lazy entry for DatasetAssetSource: a dedicated module with a default export, so the `import()` in the
// facade resolves to its own chunk instead of a synthesised namespace of a shared chunk.
export {DatasetAssetSource as default} from './DatasetAssetSource'
