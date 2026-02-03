import {env} from 'node:process'

import {
  BlueskyStrategy,
  Client,
  DevtoStrategy,
  DiscordWebhookStrategy,
  LinkedInStrategy,
  MastodonStrategy,
  SlackStrategy,
  TelegramStrategy,
  TwitterStrategy,
  type Strategy,
} from '@humanwhocodes/crosspost'
import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'
import imageUrlBuilder from '@sanity/image-url'

// Crosspost response types (not exported by the library)
type CrosspostSuccessResponse = {ok: true; url: string}
type CrosspostFailureResponse = {ok: false; reason: unknown}
type CrosspostResponse = CrosspostSuccessResponse | CrosspostFailureResponse

// Event data type matching the blueprint projection
type EventData = {
  _id: string
  body?: string
  mainImage?: {
    asset: {
      _ref: string
      _type: 'reference'
    }
    alt?: string
  }
  platforms?: string[]
  platformOverrides?: Array<{
    platform?: string
    body?: string
  }>
}

type Platform = string

type StrategyConfig = {
  strategy: Strategy
  bodyOverride: string | undefined
}

// Map our platform keys to their corresponding strategy IDs
const PLATFORM_TO_STRATEGY_ID: Record<string, string> = {
  x: 'twitter',
  discord: 'discord-webhook',
}

const {
  TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET,
  TWITTER_API_CONSUMER_KEY,
  TWITTER_API_CONSUMER_SECRET,

  MASTODON_ACCESS_TOKEN,
  MASTODON_HOST,

  BLUESKY_IDENTIFIER,
  BLUESKY_PASSWORD,
  BLUESKY_HOST,

  LINKEDIN_ACCESS_TOKEN,

  DISCORD_WEBHOOK_URL,

  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,

  SLACK_BOT_TOKEN,
  SLACK_CHANNEL,

  DEVTO_API_KEY,
} = env

const getImageData = async (
  image: EventData['mainImage'],
  client: ReturnType<typeof createClient>,
) => {
  if (!image?.asset) {
    return undefined
  }

  const builder = imageUrlBuilder(client)
  const imageUrl = builder.image(image).width(1024).quality(75).url()
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  return new Uint8Array(await response.arrayBuffer())
}

const getBody = (
  platform: Platform,
  platformOverrides: EventData['platformOverrides'],
): string | undefined => {
  const setting = platformOverrides?.find((item) => item.platform === platform)
  return setting?.body?.trim()
}

const createStrategies = (
  platforms: Platform[],
  platformOverrides: EventData['platformOverrides'],
): StrategyConfig[] => {
  const strategyConfigs: StrategyConfig[] = []

  if (
    platforms.includes('x') &&
    TWITTER_ACCESS_TOKEN_KEY &&
    TWITTER_ACCESS_TOKEN_SECRET &&
    TWITTER_API_CONSUMER_KEY &&
    TWITTER_API_CONSUMER_SECRET
  ) {
    strategyConfigs.push({
      strategy: new TwitterStrategy({
        accessTokenKey: TWITTER_ACCESS_TOKEN_KEY,
        accessTokenSecret: TWITTER_ACCESS_TOKEN_SECRET,
        apiConsumerKey: TWITTER_API_CONSUMER_KEY,
        apiConsumerSecret: TWITTER_API_CONSUMER_SECRET,
      }),
      bodyOverride: getBody('x', platformOverrides),
    })
  }

  if (platforms.includes('mastodon') && MASTODON_ACCESS_TOKEN && MASTODON_HOST) {
    strategyConfigs.push({
      strategy: new MastodonStrategy({
        accessToken: MASTODON_ACCESS_TOKEN,
        host: MASTODON_HOST,
      }),
      bodyOverride: getBody('mastodon', platformOverrides),
    })
  }

  if (platforms.includes('bluesky') && BLUESKY_IDENTIFIER && BLUESKY_PASSWORD && BLUESKY_HOST) {
    strategyConfigs.push({
      strategy: new BlueskyStrategy({
        identifier: BLUESKY_IDENTIFIER,
        password: BLUESKY_PASSWORD,
        host: BLUESKY_HOST,
      }),
      bodyOverride: getBody('bluesky', platformOverrides),
    })
  }

  if (platforms.includes('linkedin') && LINKEDIN_ACCESS_TOKEN) {
    strategyConfigs.push({
      strategy: new LinkedInStrategy({
        accessToken: LINKEDIN_ACCESS_TOKEN,
      }),
      bodyOverride: getBody('linkedin', platformOverrides),
    })
  }

  if (platforms.includes('discord') && DISCORD_WEBHOOK_URL) {
    strategyConfigs.push({
      strategy: new DiscordWebhookStrategy({
        webhookUrl: DISCORD_WEBHOOK_URL,
      }),
      bodyOverride: getBody('discord', platformOverrides),
    })
  }

  if (platforms.includes('telegram') && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    strategyConfigs.push({
      strategy: new TelegramStrategy({
        botToken: TELEGRAM_BOT_TOKEN,
        chatId: TELEGRAM_CHAT_ID,
      }),
      bodyOverride: getBody('telegram', platformOverrides),
    })
  }

  if (platforms.includes('slack') && SLACK_BOT_TOKEN && SLACK_CHANNEL) {
    strategyConfigs.push({
      strategy: new SlackStrategy({
        botToken: SLACK_BOT_TOKEN,
        channel: SLACK_CHANNEL,
      }),
      bodyOverride: getBody('slack', platformOverrides),
    })
  }

  if (platforms.includes('devto') && DEVTO_API_KEY) {
    strategyConfigs.push({
      strategy: new DevtoStrategy({
        apiKey: DEVTO_API_KEY,
      }),
      bodyOverride: getBody('devto', platformOverrides),
    })
  }

  return strategyConfigs
}

export const handler = documentEventHandler(async ({context, event}) => {
  const {local} = context // local is true when running locally
  console.log('Starting crosspost...')

  if (local) {
    console.log(
      '⚠️  Running in local development mode - posts will be sent to platforms but status updates to Sanity documents will be skipped',
    )
  }

  const {_id, mainImage, platforms, platformOverrides, body} = event.data as EventData

  if (!platforms?.length) {
    console.warn('No platforms were selected. Skipping.')
    return
  }

  if (!body) {
    console.warn('No body was found. Skipping.')
    return
  }

  const sanityClient = createClient({
    ...context.clientOptions,
    apiVersion: '2025-11-05',
    useCdn: false,
  })

  try {
    const strategyConfigs = createStrategies(platforms, platformOverrides)

    if (strategyConfigs.length === 0) {
      console.warn('No enabled strategies found. Check your environment variables.')
      return
    }

    console.log(
      `Found ${strategyConfigs.length} enabled strategies: ${strategyConfigs.map((config) => config.strategy.name).join(', ')}`,
    )

    // Identify platforms that were selected but don't have credentials configured
    const enabledPlatformIds = strategyConfigs.map((config) => config.strategy.id)
    const skippedPlatforms = platforms.filter((platform) => {
      const strategyId = PLATFORM_TO_STRATEGY_ID[platform] || platform
      return !enabledPlatformIds.includes(strategyId)
    })

    if (skippedPlatforms.length > 0) {
      console.warn(
        `Skipping ${skippedPlatforms.length} platforms due to missing credentials: ${skippedPlatforms.join(', ')}`,
      )
    }

    // Support single image attachment across all platforms
    let imageArg: {data: Uint8Array; alt: string} | undefined = undefined
    if (mainImage) {
      const imageData = await getImageData(mainImage, sanityClient)
      if (imageData) {
        imageArg = {
          data: imageData,
          alt: mainImage.alt ?? '',
        }
      }
    }

    // Set all statuses to pending (skip in local development mode)
    if (!local) {
      const statuses = [
        ...strategyConfigs.map((config) => `Posting to ${config.strategy.name}...`),
        ...skippedPlatforms.map((platform) => `Skipped ${platform}: No credentials configured`),
      ]
      await sanityClient.patch(_id).set({status: statuses}).commit()
    }

    const postPromises = strategyConfigs.map((strategyConfig, index) => {
      const strategyName = strategyConfig.strategy.name

      return (async () => {
        let resultMessage: string
        try {
          const singleStrategyClient = new Client({
            strategies: [strategyConfig.strategy],
          })

          const responses = (await singleStrategyClient.post(strategyConfig.bodyOverride ?? body, {
            images: imageArg ? [imageArg] : undefined,
          })) as CrosspostResponse[]

          const response = responses[0]

          if (response.ok) {
            const successMessage = `✅ ${response.url}`
            console.log(successMessage)
            resultMessage = successMessage
          } else {
            const error = response.reason?.toString() || 'Unknown error'
            resultMessage = `⚠️ Error posting to ${strategyName}: ${error}`
            console.error(resultMessage)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          resultMessage = `⚠️ Error posting to ${strategyName}: ${errorMessage}`
          console.error(resultMessage)
        }

        // Update the status for this specific post (skip in local development mode)
        if (!local) {
          await sanityClient.patch(_id).splice('status', index, 1, [resultMessage]).commit()
        }
      })()
    })

    await Promise.all(postPromises)
  } catch (error) {
    console.error('Error during crosspost:', error)
  }
})
