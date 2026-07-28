import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {Box, Button, Card, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {definePlugin, useClient} from 'sanity'

import {seedDemoContent} from '../../schema/coffeeShop/seedContent'

function SeedCoffeeShopTool() {
  const client = useClient({apiVersion: '2025-03-19'})
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()

  const handleSeed = useCallback(async () => {
    setSeeding(true)
    setError(undefined)
    setMessage(undefined)
    try {
      await seedDemoContent(client)
      setMessage(
        'Seeded origins, promos, products (with slugs), and the landing page. Open Presentation to preview.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSeeding(false)
    }
  }, [client])

  return (
    <Card height="fill" padding={5} tone="transparent">
      <Box style={{maxWidth: 480}}>
        <Stack space={4}>
          <Stack space={2}>
            <Text size={2} weight="semibold">
              Seed coffee shop demo
            </Text>
            <Text size={1} muted>
              Creates base published content if missing: five origins, two promos, six products with
              slugs, and the Brew & Bean landing page. Existing documents are not overwritten;
              missing product slugs are patched.
            </Text>
          </Stack>
          <Box>
            <Button
              text={seeding ? 'Seeding…' : 'Seed demo content'}
              tone="primary"
              disabled={seeding}
              onClick={handleSeed}
            />
          </Box>
          {message && (
            <Text size={1} style={{color: 'var(--card-positive-fg-color)'}}>
              {message}
            </Text>
          )}
          {error && (
            <Text size={1} style={{color: 'var(--card-critical-fg-color)'}}>
              {error}
            </Text>
          )}
        </Stack>
      </Box>
    </Card>
  )
}

export const coffeeShopSeedTool = definePlugin({
  name: 'coffee-shop-seed',
  tools: [
    {
      name: 'coffee-shop-seed',
      title: 'Seed coffee shop',
      icon: EarthGlobeIcon,
      component: SeedCoffeeShopTool,
    },
  ],
})
