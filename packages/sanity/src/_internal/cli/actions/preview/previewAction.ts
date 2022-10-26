import path from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore The `@sanity/server` may not be built yet.
import {PreviewServerOptions, startPreviewServer} from '@sanity/server'
import type {CliConfig, CliCommandArguments, CliCommandContext} from '@sanity/cli'
import {getSharedServerConfig, gracefulServerDeath} from '../../util/servers'

export interface StartPreviewServerCommandFlags {
  host?: string
  port?: string
}

export default async function startSanityPreviewServer(
  args: CliCommandArguments<StartPreviewServerCommandFlags>,
  context: CliCommandContext
): Promise<void> {
  const flags = args.extOptions
  const {workDir, cliConfig} = context

  const defaultRootDir = path.resolve(path.join(workDir, 'dist'))
  const rootDir = path.resolve(args.argsWithoutOptions[0] || defaultRootDir)
  const config = getPreviewServerConfig({flags, workDir, cliConfig, rootDir})

  try {
    await startPreviewServer(config)
  } catch (err) {
    gracefulServerDeath('preview', config.httpHost, config.httpPort, err)
  }
}

function getPreviewServerConfig({
  flags,
  workDir,
  cliConfig,
  rootDir,
}: {
  flags: StartPreviewServerCommandFlags
  rootDir: string
  workDir: string
  cliConfig?: CliConfig
}): PreviewServerOptions {
  const baseConfig = getSharedServerConfig({flags, workDir, cliConfig})
  return {
    ...baseConfig,
    root: rootDir,
  }
}
