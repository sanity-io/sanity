import {wrappedClient} from './wrappedClient'

// Expose as CJS to allow Node scripts to consume it without `.default`
// eslint-disable-next-line @typescript-eslint/no-var-requires
module.exports = wrappedClient
