#!/usr/bin/env -S pnpm tsx

import {object, or} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {multiple, optional} from '@optique/core/modifiers'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'
import {run} from '@optique/run'

import {tagVersion, uploadBundles} from '../src'
import {verify} from '../src/commands/verify'

const parser = or(
  command(
    'publish',
    object({
      action: constant('publish'),
      tag: multiple(
        option('--tag', string(), {
          description: message`Dist tag(s) to publish the bundles under`,
        }),
      ),
      // !!WARNING!! JS files are cached for 1y, so only use this only for development/testing purposes
      asVersion: optional(
        option('--as-version', string(), {
          hidden: true,
          description: message`Specify the version to upload bundles as. !!WARNING!! Only for development purposes!`,
        }),
      ),
    }),
    {description: message`Publish package bundles from dist folders`},
  ),
  command(
    'tag',
    object({
      action: constant('tag'),
      tag: option('--tag', string()),
      targetVersion: option('--target-version', string()),
    }),
    {description: message`Tag a version`},
  ),
  command('verify', object({action: constant('verify')}), {
    description: message`Verify read/write access to bucket`,
  }),
)

const args = run(parser, {
  programName: 'bundle-manager',
  help: {command: true, option: {names: ['-h', '--help']}},
  aboveError: 'usage',
})

switch (args.action) {
  case 'publish':
    await uploadBundles({
      tags: args.tag.length > 0 ? [...args.tag] : undefined,
      asVersion: args.asVersion,
    })
    break
  case 'tag':
    await tagVersion({tag: args.tag, version: args.targetVersion})
    break
  case 'verify':
    await verify()
    break
}
