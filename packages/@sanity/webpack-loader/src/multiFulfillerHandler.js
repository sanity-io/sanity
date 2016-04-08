'use strict'

const banner = [
  '/**',
  ' * Sanity role: ROLE_NAME',
  ' * ',
  ' * Sanity plugin loader multi-fulfiller wrapper',
  ' * Imports all fulfillers, then exports them as an array',
  ' */'
]

module.exports = function multiFulfillerHandler(opts, callback) {
  const fulfillers = opts.roles.fulfilled[opts.role]

  const result = banner
    .concat(fulfillers.map((fulfiller, i) =>
      `import fulfiller${i} from '${fulfiller.path}'`
    ))
    .concat(['\nmodule.exports = ['])
    .concat(fulfillers.map((__, i) => `  fulfiller${i}`).join(',\n'))
    .concat([']\n'])
    .join('\n')
    .replace(/ROLE_NAME/g, opts.role)

  callback(null, result)
}
