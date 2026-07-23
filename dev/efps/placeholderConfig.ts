// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type SingleWorkspace} from 'sanity'

declare const config: SingleWorkspace

export default config
