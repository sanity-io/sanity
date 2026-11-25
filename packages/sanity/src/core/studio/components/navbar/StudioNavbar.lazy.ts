// Lazy entry for StudioNavbar (and the StudioToolMenu it renders): a dedicated module with a default
// export, so the `import()` in the facade resolves to its own chunk instead of a synthesised
// namespace of a shared chunk.
export {StudioNavbar as default} from './StudioNavbar'
export {StudioToolMenu} from './tools/StudioToolMenu'
