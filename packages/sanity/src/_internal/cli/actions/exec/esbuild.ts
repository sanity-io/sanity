import {register} from 'esbuild-register/dist/node'

if (!__DEV__) {
  register({
    target: `node${process.version.slice(1)}`,
  })
}
