#!/usr/bin/env -S pnpm tsx
import {createLiveDeps} from '../src/cli/liveDeps'
import {runCli} from '../src/cli/main'

process.exitCode = await runCli(process.argv.slice(2), createLiveDeps())
