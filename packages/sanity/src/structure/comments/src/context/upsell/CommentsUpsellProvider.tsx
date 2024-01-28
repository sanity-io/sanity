import {useState, useMemo, useEffect} from 'react'
import {ClientConfig} from '@sanity/client'
import {CommentsUpsellData} from '../../types'
import {UpsellDialog} from '../../components'
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
  dataset: 'upsell-public-development', // TODO: Update for production when ready
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
    client
      .withConfig(UPSELL_CLIENT)
      .fetch<CommentsUpsellData | null>(QUERY)
      .then((res) => {
        setUpsellData(res)
      })
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
      <UpsellDialog />
    </CommentsUpsellContext.Provider>
  )
}
