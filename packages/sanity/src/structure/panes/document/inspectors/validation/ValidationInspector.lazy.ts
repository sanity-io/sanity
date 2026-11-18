// Lazy entry for ValidationInspector: a dedicated module with a default export, so the `import()` in the
// inspector definition resolves to its own chunk instead of a synthesised namespace of a shared chunk.
export {ValidationInspector as default} from './ValidationInspector'
