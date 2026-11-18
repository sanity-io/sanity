// Lazy entry for IncomingReferencesInspector: a dedicated module with a default export, so the `import()` in the
// inspector definition resolves to its own chunk instead of a synthesised namespace of a shared chunk.
export {IncomingReferencesInspector as default} from './IncomingReferencesInspector'
