import {PortableText} from '@portabletext/react'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {BoltIcon} from '@sanity/icons/Bolt'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {EditIcon} from '@sanity/icons/Edit'
import {RefreshIcon} from '@sanity/icons/Refresh'
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
  Popover,
  Spinner,
  Stack,
  Text,
  useClickOutsideEvent,
  useMediaIndex,
} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {getSelectedVariant, useAllVariants, useClient, usePerspective} from 'sanity'
import {useIntentLink} from 'sanity/router'

import {
  type CoffeeProductCarouselItem,
  type CoffeeProductDetail,
  type CoffeeProductListItem,
  type CoffeePromo,
  DEMO_API_VERSION,
  getVariantConditionEntries,
  LATEST_PRODUCTS_QUERY,
  PRODUCT_DETAIL_QUERY,
  VARIANT_CONDITION_QUERY_PARAM,
  VARIANT_QUERY_PARAM,
  type VariantQueryMode,
} from './constants'
import {seedDemoContent} from './seedContent'
import {type CoffeeQueryOptions, useCoffeeQuery} from './useCoffeeQuery'
import {VariantConditionsPicker} from './VariantConditionsPicker'

/**
 * A tiny "frontend" rendered as a studio tool: a coffee shop with a product listing and detail
 * pages, fetching content the way a website would. The visitor follows the studio's own selection
 * (`usePerspective`): selecting a variant in the navbar picker sends it with the query — demoing
 * personalization via the product `discount` field (and referenced promo/origin documents).
 */
export function CoffeeShopDemoTool() {
  const {selectedVariantName, perspectiveStack} = usePerspective()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [queryMode, setQueryMode] = useState<VariantQueryMode>('variant-id')
  const [variantConditions, setVariantConditions] = useState<Record<string, string>>({})

  const perspective = perspectiveStack.length > 0 ? perspectiveStack.join(',') : 'published'

  const queryOptions: Omit<CoffeeQueryOptions, 'query' | 'params'> = {
    queryMode,
    perspective,
    variantName: queryMode === 'variant-id' ? selectedVariantName : undefined,
    variantConditions: queryMode === 'variant-conditions' ? variantConditions : undefined,
  }

  return (
    <Flex direction="column" height="fill" overflow="hidden">
      <SiteHeader
        queryMode={queryMode}
        onQueryModeChange={setQueryMode}
        queryOptions={queryOptions}
        variantConditions={variantConditions}
        onVariantConditionsChange={setVariantConditions}
      />
      <Card flex={1} overflow="auto" tone="transparent" style={{overflowX: 'hidden'}}>
        <Container width={[1, 1, 2, 3]} paddingX={[3, 4, 5]} paddingY={[4, 5]}>
          {selectedProductId ? (
            <ProductDetailPage
              productId={selectedProductId}
              queryOptions={queryOptions}
              onBack={() => setSelectedProductId(null)}
              onOpenProduct={setSelectedProductId}
            />
          ) : (
            <ProductListPage queryOptions={queryOptions} onOpenProduct={setSelectedProductId} />
          )}
        </Container>
      </Card>
    </Flex>
  )
}

function QueryTargetingPopoverContent(props: {
  queryMode: VariantQueryMode
  onQueryModeChange: (mode: VariantQueryMode) => void
  variantConditions: Record<string, string>
  onVariantConditionsChange: (conditions: Record<string, string>) => void
}) {
  const {queryMode, onQueryModeChange, variantConditions, onVariantConditionsChange} = props

  return (
    <Container width={1} padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={1} weight="medium">
            How should this page resolve variants?
          </Text>
          <Text size={1} muted>
            Use the studio navbar for variant id targeting, or build condition params here to mimic
            a frontend that only knows the visitor context.
          </Text>
        </Stack>

        <Flex gap={2} wrap="wrap">
          <Button
            text="Variant id"
            mode={queryMode === 'variant-id' ? 'default' : 'ghost'}
            tone={queryMode === 'variant-id' ? 'primary' : 'default'}
            onClick={() => onQueryModeChange('variant-id')}
          />
          <Button
            text="Variant conditions"
            mode={queryMode === 'variant-conditions' ? 'default' : 'ghost'}
            tone={queryMode === 'variant-conditions' ? 'primary' : 'default'}
            onClick={() => onQueryModeChange('variant-conditions')}
          />
        </Flex>

        {queryMode === 'variant-id' ? (
          <Text size={1} muted>
            Follows the variant selected in the studio navbar. Pin a variant there to send{' '}
            <code>{VARIANT_QUERY_PARAM}=&lt;id&gt;</code> with the query.
          </Text>
        ) : (
          <VariantConditionsPicker value={variantConditions} onChange={onVariantConditionsChange} />
        )}
      </Stack>
    </Container>
  )
}

function SiteHeader(props: {
  queryMode: VariantQueryMode
  onQueryModeChange: (mode: VariantQueryMode) => void
  queryOptions: Omit<CoffeeQueryOptions, 'query' | 'params'>
  variantConditions: Record<string, string>
  onVariantConditionsChange: (conditions: Record<string, string>) => void
}) {
  const {queryMode, onQueryModeChange, queryOptions, variantConditions, onVariantConditionsChange} =
    props
  const {selectedVariantName, selectedVariant} = usePerspective()
  const mediaIndex = useMediaIndex()
  const isCompact = mediaIndex < 1
  const conditionEntries = getVariantConditionEntries(queryOptions.variantConditions)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useClickOutsideEvent(
    () => setPopoverOpen(false),
    () => [triggerRef.current, popoverRef.current],
  )

  const triggerLabel = useMemo(() => {
    if (queryMode === 'variant-id') {
      if (selectedVariantName) {
        const variantLabel = selectedVariant?.name || selectedVariantName
        return isCompact ? `Variant: ${variantLabel}` : `Returning visitor — ${variantLabel}`
      }

      return isCompact ? 'Base content' : 'New visitor — base content'
    }

    if (conditionEntries.length > 0) {
      return isCompact
        ? `${conditionEntries.length} condition${conditionEntries.length === 1 ? '' : 's'}`
        : conditionEntries.map(({param}) => param).join(', ')
    }

    return isCompact ? 'Set conditions' : 'Configure variant conditions'
  }, [conditionEntries, isCompact, queryMode, selectedVariant?.name, selectedVariantName])

  const chipTone =
    queryMode === 'variant-id'
      ? selectedVariantName
        ? 'positive'
        : 'default'
      : conditionEntries.length > 0
        ? 'positive'
        : 'default'

  const triggerTone = chipTone === 'positive' ? 'positive' : 'default'

  return (
    <Card padding={[2, 3]} borderBottom>
      <Flex align={['flex-start', 'center']} direction={['column', 'row']} gap={[3, 3]} wrap="wrap">
        <Box flex={1} style={{minWidth: 0, width: isCompact ? '100%' : undefined}}>
          <Inline space={2} wrap="wrap">
            <Heading size={isCompact ? 0 : 1}>Brew & Bean</Heading>
            <Badge tone="primary" mode="outline">
              demo shop
            </Badge>
          </Inline>
        </Box>

        <Popover
          animate={false}
          arrow
          open={popoverOpen}
          placement="bottom-end"
          portal
          ref={popoverRef}
          content={
            <QueryTargetingPopoverContent
              queryMode={queryMode}
              onQueryModeChange={onQueryModeChange}
              variantConditions={variantConditions}
              onVariantConditionsChange={onVariantConditionsChange}
            />
          }
        >
          <Button
            ref={triggerRef}
            fontSize={1}
            iconRight={ChevronDownIcon}
            mode="bleed"
            onClick={() => setPopoverOpen((open) => !open)}
            padding={2}
            radius="full"
            selected={popoverOpen}
            style={{maxWidth: '100%'}}
            text={triggerLabel}
            tone={triggerTone}
          />
        </Popover>
      </Flex>
    </Card>
  )
}

function ProductListPage(props: {
  queryOptions: Omit<CoffeeQueryOptions, 'query' | 'params'>
  onOpenProduct: (id: string) => void
}) {
  const {queryOptions, onOpenProduct} = props
  const {data, loading, error, requestUrl, refetch} = useCoffeeQuery<CoffeeProductListItem[]>({
    query: LATEST_PRODUCTS_QUERY,
    ...queryOptions,
  })

  return (
    <Stack space={[4, 5]} style={{minWidth: 0, maxWidth: '100%'}}>
      <Flex align={['stretch', 'center']} direction={['column', 'row']} gap={3} wrap="wrap">
        <Box flex={1} style={{minWidth: 0}}>
          <Stack space={2}>
            <Heading size={[2, 3]}>Our coffees</Heading>
            <Text size={1} muted>
              Small-batch roasts shipped fresh. Select a variant in the navbar to see personalized
              discounts.
            </Text>
          </Stack>
        </Box>
        <Button icon={RefreshIcon} text="Refresh" mode="ghost" onClick={refetch} />
      </Flex>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (data?.length ?? 0) === 0 && <EmptyState onSeeded={refetch} />}

      {!loading && !error && data && data.length > 0 && (
        <Grid columns={[1, 2, 2, 3]} gap={[3, 4]} style={{minWidth: 0, width: '100%'}}>
          {data.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onOpen={() => onOpenProduct(product._id)}
            />
          ))}
        </Grid>
      )}

      <RequestInspector requestUrl={requestUrl} queryOptions={queryOptions} />
    </Stack>
  )
}

function ProductCard(props: {product: CoffeeProductListItem; onOpen: () => void}) {
  const {product, onOpen} = props

  return (
    <Card radius={3} shadow={1} overflow="hidden" tone="default" style={{minWidth: 0}}>
      <Stack>
        <CoverImage imageUrl={product.imageUrl} title={product.title} variant="card" />
        <Box padding={[3, 4]} style={{minWidth: 0}}>
          <Stack space={3}>
            <Flex align="center" gap={2} wrap="wrap">
              {typeof product.discount === 'number' && product.discount > 0 && (
                <Badge tone="critical">{product.discount}% off</Badge>
              )}
              <ProductPrice price={product.price} discount={product.discount} size={1} />
            </Flex>
            <Heading size={1} style={{overflowWrap: 'anywhere'}}>
              {product.title || 'Untitled'}
            </Heading>
            {product.excerpt && (
              <Text size={1} muted style={{overflowWrap: 'anywhere'}}>
                {product.excerpt}
              </Text>
            )}
            <Text size={1} muted>
              {product.origin?.name
                ? `From ${product.origin.name}${product.origin.region ? `, ${product.origin.region}` : ''}`
                : 'Origin unknown'}
            </Text>
            <Flex gap={2} wrap="wrap" justify="space-between">
              <OpenInStructureButton documentId={product._id} mode="bleed" />
              <Button text="View product" mode="ghost" tone="primary" onClick={onOpen} />
            </Flex>
          </Stack>
        </Box>
      </Stack>
    </Card>
  )
}

function ProductDetailPage(props: {
  productId: string
  queryOptions: Omit<CoffeeQueryOptions, 'query' | 'params'>
  onBack: () => void
  onOpenProduct: (id: string) => void
}) {
  const {productId, queryOptions, onBack, onOpenProduct} = props
  const mediaIndex = useMediaIndex()
  const isWide = mediaIndex >= 2
  const {data, loading, error, requestUrl, refetch} = useCoffeeQuery<CoffeeProductDetail | null>({
    query: PRODUCT_DETAIL_QUERY,
    params: {id: productId},
    ...queryOptions,
  })

  return (
    <Stack space={[4, 5]}>
      <Flex align={['stretch', 'center']} direction={['column', 'row']} gap={2} wrap="wrap">
        <Box flex={1} style={{minWidth: 0}}>
          <Button icon={ArrowLeftIcon} text="All products" mode="ghost" onClick={onBack} />
        </Box>
        <Flex gap={2} wrap="wrap">
          <OpenInStructureButton documentId={productId} />
          <Button icon={RefreshIcon} text="Refresh" mode="ghost" onClick={refetch} />
        </Flex>
      </Flex>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}
      {!loading && !error && !data && (
        <Card padding={5} radius={3} tone="caution">
          <Text size={1}>This product has no published content for the current audience.</Text>
        </Card>
      )}

      {!loading && !error && data && (
        <Stack space={[4, 5]}>
          <Grid columns={isWide ? 2 : 1} gap={[4, 5]}>
            <CoverImage imageUrl={data.imageUrl} title={data.title} variant="hero" />
            <Stack space={4} style={{minWidth: 0}}>
              <Flex align="center" gap={2} wrap="wrap">
                {typeof data.discount === 'number' && data.discount > 0 && (
                  <Badge tone="critical">{data.discount}% off</Badge>
                )}
                <ProductPrice price={data.price} discount={data.discount} size={isWide ? 2 : 1} />
              </Flex>
              <Heading size={isWide ? 4 : 3}>{data.title || 'Untitled'}</Heading>
              <Text size={1} muted>
                {data.origin?.name
                  ? `Roasted from ${data.origin.name}${data.origin.region ? `, ${data.origin.region}` : ''}`
                  : 'Origin unknown'}
              </Text>
              {data.excerpt && (
                <Text size={1} muted>
                  {data.excerpt}
                </Text>
              )}
            </Stack>
          </Grid>

          {Array.isArray(data.description) && data.description.length > 0 && (
            <Card padding={0} tone="transparent" style={{maxWidth: isWide ? '72ch' : undefined}}>
              <Stack space={4}>
                <PortableText
                  value={data.description as any}
                  components={{
                    block: {
                      normal: ({children}) => (
                        <Text size={[1, 2]} style={{lineHeight: 1.65}}>
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

          {(data.latestProducts?.length ?? 0) > 0 && (
            <LatestProductsCarousel products={data.latestProducts!} onOpenProduct={onOpenProduct} />
          )}
        </Stack>
      )}

      <RequestInspector requestUrl={requestUrl} queryOptions={queryOptions} />
    </Stack>
  )
}

function LatestProductsCarousel(props: {
  products: CoffeeProductCarouselItem[]
  onOpenProduct: (id: string) => void
}) {
  const {products, onOpenProduct} = props

  return (
    <Stack space={4}>
      <Heading size={[1, 2]}>You might also like</Heading>
      <Grid columns={[1, 2, 3]} gap={[3, 4]}>
        {products.map((product) => (
          <Card key={product._id} radius={3} shadow={1} overflow="hidden">
            <Stack>
              <CoverImage imageUrl={product.imageUrl} title={product.title} variant="carousel" />
              <Box padding={3}>
                <Stack space={2}>
                  <Flex align="center" gap={2} wrap="wrap">
                    {typeof product.discount === 'number' && product.discount > 0 && (
                      <Badge tone="critical" fontSize={0}>
                        {product.discount}% off
                      </Badge>
                    )}
                    <ProductPrice price={product.price} discount={product.discount} size={0} />
                  </Flex>
                  <Text size={1} weight="medium">
                    {product.title || 'Untitled'}
                  </Text>
                  <Button
                    text="View"
                    mode="ghost"
                    tone="primary"
                    fontSize={1}
                    onClick={() => onOpenProduct(product._id)}
                  />
                </Stack>
              </Box>
            </Stack>
          </Card>
        ))}
      </Grid>
    </Stack>
  )
}

function ProductPrice(props: {price?: number; discount?: number; size: 0 | 1 | 2}) {
  const {price, discount, size} = props

  if (typeof price !== 'number') {
    return null
  }

  const hasDiscount = typeof discount === 'number' && discount > 0
  const salePrice = hasDiscount ? price * (1 - discount / 100) : price

  return (
    <Inline space={2}>
      <Text size={size} weight="semibold">
        ${salePrice.toFixed(2)}
      </Text>
      {hasDiscount && (
        <Text size={size} muted style={{textDecoration: 'line-through'}}>
          ${price.toFixed(2)}
        </Text>
      )}
    </Inline>
  )
}

function OpenInStructureButton(props: {documentId: string; mode?: 'bleed' | 'ghost'}) {
  const {documentId, mode = 'ghost'} = props
  const {onClick, href} = useIntentLink({
    intent: 'edit',
    params: {id: documentId, type: 'demoCoffeeProduct'},
  })

  return (
    <Button as="a" href={href} onClick={onClick} icon={EditIcon} text="" mode={mode} fontSize={1} />
  )
}

function PromoBanner(props: {promo: CoffeePromo}) {
  const {promo} = props

  return (
    <Card padding={[3, 4]} radius={3} tone="primary" shadow={1}>
      <Flex align={['stretch', 'center']} direction={['column', 'row']} gap={[3, 4]} wrap="wrap">
        <Box flex={1} style={{minWidth: 0}}>
          <Stack space={3}>
            <Heading size={[0, 1]}>{promo.title || 'Special offer'}</Heading>
            {promo.tagline && <Text size={1}>{promo.tagline}</Text>}
          </Stack>
        </Box>
        <Button text={promo.ctaLabel || 'Shop now'} tone="critical" />
      </Flex>
    </Card>
  )
}

type CoverImageVariant = 'card' | 'hero' | 'carousel'

const COVER_IMAGE_STYLES: Record<
  CoverImageVariant,
  {aspectRatio: string; maxHeight?: string; imageWidth: number}
> = {
  card: {aspectRatio: '4 / 3', maxHeight: '320px', imageWidth: 800},
  hero: {aspectRatio: '16 / 10', maxHeight: 'min(56vh, 520px)', imageWidth: 1400},
  carousel: {aspectRatio: '4 / 3', maxHeight: '220px', imageWidth: 600},
}

function CoverImage(props: {imageUrl?: string; title?: string; variant: CoverImageVariant}) {
  const {imageUrl, title, variant} = props
  const {aspectRatio, maxHeight, imageWidth} = COVER_IMAGE_STYLES[variant]

  if (imageUrl) {
    return (
      <img
        src={`${imageUrl}?w=${imageWidth}&fit=crop&auto=format`}
        alt={title || ''}
        style={{
          width: '100%',
          maxWidth: '100%',
          aspectRatio,
          maxHeight,
          objectFit: 'cover',
          display: 'block',
        }}
      />
    )
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        width: '100%',
        aspectRatio,
        maxHeight,
        background: 'linear-gradient(135deg, #8b5e3c 0%, #4a2c17 100%)',
      }}
    >
      <Text size={4} style={{color: 'white', opacity: 0.75}}>
        ☕
      </Text>
    </Flex>
  )
}

function RequestInspector(props: {
  requestUrl: string
  queryOptions: Omit<CoffeeQueryOptions, 'query' | 'params'>
}) {
  const {requestUrl, queryOptions} = props
  const {queryMode, perspective, variantName, variantConditions} = queryOptions
  const [open, setOpen] = useState(false)
  const {byId: variantsById} = useAllVariants()

  const selectedVariant = useMemo(
    () => getSelectedVariant({selectedVariantName: variantName, variantsById}),
    [variantName, variantsById],
  )

  const variantLabel = selectedVariant?.name || variantName
  const conditionEntries = getVariantConditionEntries(variantConditions)

  return (
    <Card radius={3} border tone="transparent" style={{minWidth: 0, maxWidth: '100%'}}>
      <Stack space={0}>
        <Flex
          align={['flex-start', 'center']}
          direction={['column', 'row']}
          padding={2}
          gap={2}
          wrap="wrap"
          style={{minWidth: 0}}
        >
          <Button
            icon={BoltIcon}
            text={open ? 'Hide request' : 'What is the page requesting?'}
            mode="bleed"
            fontSize={1}
            onClick={() => setOpen((current) => !current)}
            style={{maxWidth: '100%'}}
          />
          <Inline
            space={2}
            style={{
              marginLeft: 'auto',
              maxWidth: '100%',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <Badge mode="outline" style={{overflowWrap: 'anywhere'}}>
              perspective={perspective}
            </Badge>
            {queryMode === 'variant-id' ? (
              variantName ? (
                <Badge tone="positive" style={{overflowWrap: 'anywhere'}}>
                  variant: {variantLabel}
                </Badge>
              ) : (
                <Badge tone="default" mode="outline">
                  no variant — base content
                </Badge>
              )
            ) : conditionEntries.length > 0 ? (
              conditionEntries.map(({param}) => (
                <Badge key={param} tone="positive" style={{overflowWrap: 'anywhere'}}>
                  {VARIANT_CONDITION_QUERY_PARAM}={param}
                </Badge>
              ))
            ) : (
              <Badge tone="default" mode="outline">
                no {VARIANT_CONDITION_QUERY_PARAM}
              </Badge>
            )}
          </Inline>
        </Flex>
        {open && (
          <Box padding={[2, 3]}>
            <Stack space={3}>
              <Text size={1} muted>
                The page fetches content like any frontend would. The query always carries a
                perspective (published, drafts, or a release stack). Variant content is requested
                either by variant id or by one or more <code>variantCondition</code> parameters —
                the API returns variant content where it matches and base content everywhere else.
              </Text>
              <Stack space={2}>
                <Text size={1} weight="medium">
                  Query parameters
                </Text>
                <Inline space={2} style={{flexWrap: 'wrap'}}>
                  <Badge mode="outline">perspective={perspective}</Badge>
                  {queryMode === 'variant-id' ? (
                    variantName ? (
                      <Badge tone="positive">
                        {VARIANT_QUERY_PARAM}={variantName}
                        {variantLabel && variantLabel !== variantName ? ` (${variantLabel})` : ''}
                      </Badge>
                    ) : (
                      <Badge mode="outline">no {VARIANT_QUERY_PARAM}</Badge>
                    )
                  ) : conditionEntries.length > 0 ? (
                    conditionEntries.map(({param}) => (
                      <Badge key={param} tone="positive">
                        {VARIANT_CONDITION_QUERY_PARAM}={param}
                      </Badge>
                    ))
                  ) : (
                    <Badge mode="outline">no {VARIANT_CONDITION_QUERY_PARAM}</Badge>
                  )}
                </Inline>
              </Stack>
              <Card
                padding={3}
                radius={2}
                tone="transparent"
                border
                overflow="auto"
                style={{maxWidth: '100%'}}
              >
                <Code
                  size={0}
                  language="text"
                  style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}
                >
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
          dev/test-studio/plugins/variants-coffee-demo/constants.ts.
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
          No published products yet
        </Text>
        <Text size={1} muted>
          Seed the base demo content (five origins, two promos, and six products with full
          descriptions), then create the returning-visitors variant in the Variants tool and
          override product discounts through the document editor.
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
