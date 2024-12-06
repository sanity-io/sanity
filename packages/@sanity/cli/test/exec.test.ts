import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {getCliUserEmail, runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity exec`', () => {
  describe.each(studioVersions)('%s', (version) => {
    testConcurrent('sanity exec', async () => {
      const result = await runSanityCmdCommand(version, ['exec', 'script.ts'])
      const data = JSON.parse(result.stdout.trim())
      expect(Object.keys(data.user)).toHaveLength(0)
      // Check that we load from .env.development
      expect(data.env.SANITY_STUDIO_MODE).toBe('development')
      expect(result.code).toBe(0)
    })

    testConcurrent('sanity exec --with-user-token', async () => {
      const result = await runSanityCmdCommand(version, ['exec', 'script.ts', '--with-user-token'])
      const data = JSON.parse(result.stdout.trim())
      expect(data.user.email).toBe(await getCliUserEmail())
      // Check that we load from .env.development
      expect(data.env.SANITY_STUDIO_MODE).toBe('development')
      expect(result.code).toBe(0)
    })

    testConcurrent('sanity exec with env override', async () => {
      const result = await runSanityCmdCommand(version, ['exec', 'script.ts'], {
        env: {SANITY_ACTIVE_ENV: 'production'},
      })
      const data = JSON.parse(result.stdout.trim())
      // Check that we load from .env.production
      expect(data.env.SANITY_STUDIO_MODE).toBe('production')
      expect(result.code).toBe(0)
    })
  })
})
