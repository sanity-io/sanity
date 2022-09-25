import {register} from 'esbuild-register/dist/node'

register({
  target: `node${process.version.slice(1)}`,
})
