import {useState, useMemo, useEffect} from 'react'
import {ClientConfig} from '@sanity/client'
import {CommentsUpsellData} from '../../types'
import {CommentsUpsellDialog} from '../../components'
import {CommentsUpsellContext} from './CommentsUpsellContext'
import {CommentsUpsellContextValue} from './types'
import {useClient, DEFAULT_STUDIO_CLIENT_OPTIONS} from 'sanity'

const QUERY = `*[_type == "upsellUI" && id == "comments-upsell"][0]{
    ...,
   image {
       asset-> { url, altText }
     },
     descriptionText[]{
       ...,
       _type == "iconAndText" => {
         ...,
         icon {
           "url": asset->.url
         }
       },
       _type == "block" => {
         ...,
           children[] {
             ...,
             _type == "inlineIcon" => {
               icon {"url": asset->.url}
             }
         }
       }
     }
 }`

const UPSELL_CLIENT: Partial<ClientConfig> = {
  dataset: 'upsell-public-production',
  projectId: 'pyrmmpch',
  withCredentials: false,
  useCdn: true,
}

/**
 * @beta
 * @hidden
 */
export function CommentsUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<CommentsUpsellData | null>(null)

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  useEffect(() => {
    const data$ = client
      .withConfig(UPSELL_CLIENT)
      .observable.fetch<CommentsUpsellData | null>(QUERY)

    const sub = data$.subscribe(setUpsellData)

    return () => {
      sub.unsubscribe()
    }
  }, [client])

  const ctxValue = useMemo<CommentsUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      setUpsellDialogOpen,
      upsellData,
    }),
    [upsellDialogOpen, setUpsellDialogOpen, upsellData],
  )

  return (
    <CommentsUpsellContext.Provider value={ctxValue}>
      {props.children}
      <CommentsUpsellDialog />
    </CommentsUpsellContext.Provider>
  )
}
