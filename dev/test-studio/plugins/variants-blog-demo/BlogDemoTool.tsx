import {PortableText} from '@portabletext/react'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {BoltIcon} from '@sanity/icons/Bolt'
import {EditIcon} from '@sanity/icons/Edit'
import {RefreshIcon} from '@sanity/icons/Refresh'
import {UserIcon} from '@sanity/icons/User'
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Container,
  Flex,
  Grid,
  Heading,
  Inline,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useClient, usePerspective} from 'sanity'
import {useIntentLink} from 'sanity/router'

import {
  type BlogPostDetail,
  type BlogPostListItem,
  type BlogPromo,
  DEMO_API_VERSION,
  LATEST_POSTS_QUERY,
  POST_DETAIL_QUERY,
  VARIANT_QUERY_PARAM,
} from './constants'
import {seedDemoContent} from './seedContent'
import {useBlogQuery} from './useBlogQuery'

/**
 * A tiny "frontend" rendered as a studio tool: a blog with a listing page and a details page,
 * fetching content the way a website would. The "visitor" follows the studio's own selection
 * (`usePerspective`): selecting a variant in the navbar picker sends it with the query — demoing
 * personalization, including variant resolution of referenced documents (author/promo) — and the
 * pinned perspective (published/drafts/release) drives the query's perspective.
 */
export function BlogDemoTool() {
  const {selectedVariantName, perspectiveStack} = usePerspective()
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  // The studio's pinned perspective, as the query API expects it. Default (nothing pinned)
  // renders like a live site: published content.
  const perspective = perspectiveStack.length > 0 ? perspectiveStack.join(',') : 'published'

  return (
    <Flex direction="column" height="fill" overflow="hidden">
      <SiteHeader />
      <Card flex={1} overflow="auto" tone="transparent">
        <Container width={2} paddingX={4} paddingY={5}>
          {selectedPostId ? (
            <PostDetailPage
              postId={selectedPostId}
              variantName={selectedVariantName}
              perspective={perspective}
              onBack={() => setSelectedPostId(null)}
            />
          ) : (
            <PostListPage
              variantName={selectedVariantName}
              perspective={perspective}
              onOpenPost={setSelectedPostId}
            />
          )}
        </Container>
      </Card>
    </Flex>
  )
}

function SiteHeader() {
  const {selectedVariantName, selectedVariant} = usePerspective()

  return (
    <Card padding={3} borderBottom>
      <Flex align="center" gap={3} wrap="wrap">
        <Box flex={1}>
          <Inline space={2}>
            <Heading size={1}>The Roast Report</Heading>
            <Badge tone="primary" mode="outline">
              demo site
            </Badge>
          </Inline>
        </Box>

        {/* The visitor follows the studio's variant picker in the navbar. */}
        {/* <Flex align="center" gap={2} wrap="wrap">
          {selectedVariantName ? (
            <Badge tone="positive" padding={2}>
              Returning visitor — variant: {selectedVariant?.name || selectedVariantName}
            </Badge>
          ) : (
            <Badge mode="outline" padding={2}>
              New visitor — base content
            </Badge>
          )}
        </Flex> */}
      </Flex>
    </Card>
  )
}

function PostListPage(props: {
  variantName?: string
  perspective: string
  onOpenPost: (id: string) => void
}) {
  const {variantName, perspective, onOpenPost} = props
  const {data, loading, error, requestUrl, refetch} = useBlogQuery<BlogPostListItem[]>({
    query: LATEST_POSTS_QUERY,
    variantName,
    perspective,
  })

  return (
    <Stack space={5}>
      <Flex align="center" gap={3}>
        <Box flex={1}>
          <Stack space={2}>
            <Heading size={3}>Latest from the blog</Heading>
            <Text size={1} muted>
              Everything we know about better coffee, published weekly.
            </Text>
          </Stack>
        </Box>
        <Button icon={RefreshIcon} text="Refresh" mode="ghost" onClick={refetch} />
      </Flex>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (data?.length ?? 0) === 0 && <EmptyState onSeeded={refetch} />}

      {!loading && !error && data && data.length > 0 && (
        <Grid columns={[1, 1, 2, 3]} gap={4}>
          {data.map((post) => (
            <PostCard key={post._id} post={post} onOpen={() => onOpenPost(post._id)} />
          ))}
        </Grid>
      )}

      <RequestInspector requestUrl={requestUrl} variantName={variantName} />
    </Stack>
  )
}

function PostCard(props: {post: BlogPostListItem; onOpen: () => void}) {
  const {post, onOpen} = props

  return (
    <Card radius={3} shadow={1} overflow="hidden" tone="default">
      <Stack>
        <CoverImage imageUrl={post.imageUrl} title={post.title} height={140} />
        <Box padding={4}>
          <Stack space={3}>
            {typeof post.promo?.discountPercentage === 'number' && (
              <Inline space={2}>
                <Badge tone="critical">{post.promo.discountPercentage}% off</Badge>
              </Inline>
            )}
            <Heading size={1}>{post.title || 'Untitled'}</Heading>
            {post.excerpt && (
              <Text size={1} muted>
                {post.excerpt}
              </Text>
            )}
            <Flex align="center" gap={2}>
              <Text size={1} muted>
                {post.author?.name ? `By ${post.author.name}` : 'Unknown author'}
              </Text>
            </Flex>
            <Flex gap={2} wrap="wrap" justify="space-between">
              <OpenInStructureButton documentId={post._id} mode="bleed" />
              <Button text="Read post" mode="ghost" tone="primary" onClick={onOpen} />
            </Flex>
          </Stack>
        </Box>
      </Stack>
    </Card>
  )
}

function PostDetailPage(props: {
  postId: string
  variantName?: string
  perspective: string
  onBack: () => void
}) {
  const {postId, variantName, perspective, onBack} = props
  const {data, loading, error, requestUrl, refetch} = useBlogQuery<BlogPostDetail | null>({
    query: POST_DETAIL_QUERY,
    params: {id: postId},
    variantName,
    perspective,
  })

  return (
    <Stack space={5}>
      <Flex align="center" gap={3}>
        <Box flex={1}>
          <Button icon={ArrowLeftIcon} text="All posts" mode="ghost" onClick={onBack} />
        </Box>
        <OpenInStructureButton documentId={postId} />
        <Button icon={RefreshIcon} text="Refresh" mode="ghost" onClick={refetch} />
      </Flex>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}
      {!loading && !error && !data && (
        <Card padding={5} radius={3} tone="caution">
          <Text size={1}>This post has no published content for the current audience.</Text>
        </Card>
      )}

      {!loading && !error && data && (
        <Stack space={5}>
          <CoverImage imageUrl={data.imageUrl} title={data.title} height={260} />
          <Stack space={4}>
            <Heading size={4}>{data.title || 'Untitled'}</Heading>
            <Flex align="center" gap={2}>
              <Text size={1} muted>
                {data.author?.name ? `By ${data.author.name}` : 'Unknown author'}
                {data.author?.role ? ` — ${data.author.role}` : ''}
              </Text>
            </Flex>
          </Stack>

          {Array.isArray(data.description) && data.description.length > 0 && (
            <Card padding={0}>
              <Stack space={4}>
                <PortableText
                  value={data.description as any}
                  components={{
                    block: {
                      normal: ({children}) => (
                        <Text size={2} style={{lineHeight: 1.6}}>
                          {children}
                        </Text>
                      ),
                    },
                  }}
                />
              </Stack>
            </Card>
          )}

          {data.promo && <PromoBanner promo={data.promo} />}
        </Stack>
      )}

      <RequestInspector requestUrl={requestUrl} variantName={variantName} />
    </Stack>
  )
}

/** Links a demo document to its editor in the structure tool — handy mid-demo. */
function OpenInStructureButton(props: {documentId: string; mode?: 'bleed' | 'ghost'}) {
  const {documentId, mode = 'ghost'} = props
  const {onClick, href} = useIntentLink({
    intent: 'edit',
    params: {id: documentId, type: 'demoBlogPost'},
  })

  return (
    <Button as="a" href={href} onClick={onClick} icon={EditIcon} text="" mode={mode} fontSize={1} />
  )
}

function PromoBanner(props: {promo: BlogPromo}) {
  const {promo} = props

  return (
    <Card padding={4} radius={3} tone="primary" shadow={1}>
      <Flex align="center" gap={4} wrap="wrap">
        <Box flex={1}>
          <Stack space={3}>
            <Inline space={2}>
              <Heading size={1}>{promo.title || 'Special offer'}</Heading>
              {typeof promo.discountPercentage === 'number' && (
                <Badge tone="critical">{promo.discountPercentage}% off</Badge>
              )}
            </Inline>
            {promo.tagline && <Text size={1}>{promo.tagline}</Text>}
          </Stack>
        </Box>
        <Button text={promo.ctaLabel || 'Shop now'} tone="critical" />
      </Flex>
    </Card>
  )
}

function CoverImage(props: {imageUrl?: string; title?: string; height: number}) {
  const {imageUrl, title, height} = props

  if (imageUrl) {
    return (
      <img
        src={`${imageUrl}?h=${height * 2}&fit=crop`}
        alt={title || ''}
        style={{width: '100%', height, objectFit: 'cover', display: 'block'}}
      />
    )
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        height,
        background: 'linear-gradient(135deg, #8b5e3c 0%, #4a2c17 100%)',
      }}
    >
      <Text size={4} style={{color: 'white', opacity: 0.75}}>
        ☕
      </Text>
    </Flex>
  )
}

function RequestInspector(props: {requestUrl: string; variantName?: string}) {
  const {requestUrl, variantName} = props
  const [open, setOpen] = useState(false)

  return (
    <Card radius={3} border tone="transparent">
      <Stack space={0}>
        <Flex align="center" padding={2} gap={2}>
          <Button
            icon={BoltIcon}
            text={open ? 'Hide request' : 'What is the page requesting?'}
            mode="bleed"
            fontSize={1}
            onClick={() => setOpen((current) => !current)}
          />
          <Box flex={1} />
          {variantName ? (
            <Badge tone="positive">
              {VARIANT_QUERY_PARAM}={variantName}
            </Badge>
          ) : (
            <Badge tone="default" mode="outline">
              no variant — base content
            </Badge>
          )}
        </Flex>
        {open && (
          <Box padding={3}>
            <Stack space={3}>
              <Text size={1} muted>
                The page fetches published content like any frontend would. When the visitor is
                recognized, the SAME query is sent with the variant parameter — the API returns
                variant content where it exists (including for referenced documents) and base
                content everywhere else.
              </Text>
              <Card padding={3} radius={2} tone="transparent" border overflow="auto">
                <Code size={0} language="text">
                  {`GET ${requestUrl}`}
                </Code>
              </Card>
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  )
}

function LoadingBlock() {
  return (
    <Flex align="center" justify="center" padding={6}>
      <Spinner muted />
    </Flex>
  )
}

function ErrorBlock(props: {message: string}) {
  return (
    <Card padding={4} radius={3} tone="critical">
      <Stack space={3}>
        <Text size={1} weight="medium">
          Query failed
        </Text>
        <Text size={1}>{props.message}</Text>
        <Text size={1} muted>
          If the failure mentions an unknown parameter, the deployed API may expect a different
          variant parameter name — adjust VARIANT_QUERY_PARAM in
          dev/test-studio/plugins/variants-blog-demo/constants.ts.
        </Text>
      </Stack>
    </Card>
  )
}

function EmptyState(props: {onSeeded: () => void}) {
  const {onSeeded} = props
  const client = useClient({apiVersion: DEMO_API_VERSION})
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | undefined>(undefined)

  const handleSeed = useCallback(async () => {
    setSeeding(true)
    setSeedError(undefined)
    try {
      await seedDemoContent(client)
      onSeeded()
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : String(err))
    } finally {
      setSeeding(false)
    }
  }, [client, onSeeded])

  return (
    <Card padding={5} radius={3} border tone="transparent">
      <Stack space={4}>
        <Text size={1} weight="medium">
          No published posts yet
        </Text>
        <Text size={1} muted>
          Seed the base demo content (authors, a promo, and three posts), then create the
          returning-visitors variant in the Variants tool and add posts or the promo to it through
          the document editor.
        </Text>
        <Box>
          <Button
            text={seeding ? 'Seeding…' : 'Seed demo content'}
            tone="primary"
            disabled={seeding}
            onClick={handleSeed}
          />
        </Box>
        {seedError && (
          <Text size={1} style={{color: 'red'}}>
            {seedError}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
