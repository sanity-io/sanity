type MaybeESM = {
  __esModule?: boolean
  default: any
}

export default (mod: MaybeESM) => (mod && mod.__esModule ? mod.default : mod)
