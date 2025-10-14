import {documentEventHandler, type DocumentEvent} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {toHTML} from '@portabletext/to-html'

interface EmailDocument {
  _id: string
  _type: string
  title?: string
  slug?: {
    current: string
  }
  body?: any[]
  marketingCampaign?: {
    _ref: string
  }
  klaviyoListId?: string
  operation?: string
}

// Note: DocumentEvent from @sanity/functions doesn't include operation property
// We'll need to determine the operation from the event data or use a different approach

interface KlaviyoCampaignResponse {
  data: {
    id: string
    type: string
    attributes: {
      name: string
      status: string
    }
    relationships: {
      'campaign-messages': {
        data: Array<{
          id: string
          type: string
        }>
      }
    }
  }
}

interface KlaviyoTemplateResponse {
  data: {
    id: string
    type: string
    attributes: {
      name: string
      html: string
      text: string
    }
  }
}

export const handler = documentEventHandler(
  async ({context, event}: {context: any; event: DocumentEvent<EmailDocument>}) => {
    console.log('👋 Marketing Campaign Function called at', new Date().toISOString())
    console.log('👋 Event:', event)

    try {
      const {_id, _type, title, slug, klaviyoListId, operation} = event.data as EmailDocument

      // Determine operation based on whether marketingCampaign already exists
      console.log('👋 Determined operation:', operation)

      // Get Klaviyo API credentials from environment
      const klaviyoApiKey = process.env.KLAVIYO_API_KEY
      const localKlaviyoListId = klaviyoListId || process.env.KLAVIYO_LIST_ID

      if (!klaviyoApiKey) {
        console.error('❌ KLAVIYO_API_KEY not found in environment variables')
        return
      }

      if (!localKlaviyoListId) {
        console.error('❌ KLAVIYO_LIST_ID not found in environment variables')
        return
      }

      if (_type !== 'emails') {
        console.log('⏭️ Skipping non-emails document:', _type)
        return
      }

      const client = createClient({
        ...context.clientOptions,
        dataset: 'production',
        apiVersion: '2025-06-01',
      })

      // Handle different operations based on delta
      if (operation === 'create') {
        console.log('🆕 CREATE operation: Creating new marketing campaign and template')
        await handleCreateOperation(client, _id, title, slug, localKlaviyoListId, klaviyoApiKey)
      } else if (operation === 'update') {
        console.log('🔄 UPDATE operation: Updating existing template only')
        await handleUpdateOperation(client, _id, title, slug, klaviyoApiKey)
      } else {
        console.log('⏭️ Skipping operation:', operation)
        return
      }
    } catch (error) {
      console.error('❌ Error processing emails for marketing campaign:', error)
      throw error
    }
  },
)

// Handler for CREATE operation - creates new campaign and template
async function handleCreateOperation(
  client: any,
  emailId: string,
  title: string | undefined,
  slug: {current: string} | undefined,
  klaviyoListId: string,
  klaviyoApiKey: string,
) {
  console.log('🆕 CREATE: Creating new marketing campaign and template for email:', emailId)

  if (!title || title.trim().length === 0) {
    console.error('❌ Email title is required for template creation')
    return
  }

  try {
    // Fetch nested data in the body for html rendering
    const {body: bodyData} = await client.fetch(portableTextBodyQuery(emailId))

    console.log('📋 Body data:', bodyData)

    // Generate email templates
    const htmlContent = await generateEmailTemplate(title, slug?.current, bodyData)
    const textContent = generateTextContent(title, slug?.current)

    // Create Klaviyo template
    console.log('🎨 Creating Klaviyo template for email:', title)
    const templateData = {
      data: {
        type: 'template',
        attributes: {
          name: `${title} - Template`,
          editor_type: 'CODE',
          html: htmlContent,
          text: textContent,
        },
      },
    }

    const templateResponse = await fetch('https://a.klaviyo.com/api/templates', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
        'Content-Type': 'application/json',
        'accept': 'application/vnd.api+json',
        'revision': '2025-07-15',
      },
      body: JSON.stringify(templateData),
    })

    if (!templateResponse.ok) {
      const errorText = await templateResponse.text()
      console.error('❌ Failed to create Klaviyo template:', templateResponse.status, errorText)
      return
    }

    const template: KlaviyoTemplateResponse = await templateResponse.json()
    console.log(
      '✅ Created Klaviyo template:',
      template.data.id,
      'Name:',
      template.data.attributes.name,
    )

    // Create Klaviyo campaign
    console.log('📢 Creating Klaviyo campaign for email:', title)
    const campaignData = {
      data: {
        type: 'campaign',
        attributes: {
          'name': `${title} - Campaign`,
          'audiences': {
            included: [klaviyoListId],
          },
          'send_strategy': {
            method: 'immediate',
          },
          'send_options': {
            use_smart_sending: true,
          },
          'tracking_options': {
            add_tracking_params: true,
            custom_tracking_params: [
              {
                type: 'dynamic',
                value: 'campaign_id',
                name: 'utm_medium',
              },
              {
                type: 'static',
                value: 'email',
                name: 'utm_source',
              },
            ],
            is_tracking_clicks: true,
            is_tracking_opens: true,
          },
          'campaign-messages': {
            data: [
              {
                type: 'campaign-message',
                attributes: {
                  definition: {
                    channel: 'email',
                    label: 'My message name',
                    content: {
                      subject: title,
                      preview_text: 'My preview text',
                      from_email: process.env.KLAVIYO_FROM_EMAIL || 'noreply@yourdomain.com',
                      from_label: 'My Company',
                      reply_to_email:
                        process.env.KLAVIYO_REPLY_TO_EMAIL || 'reply-to@yourdomain.com',
                      cc_email: process.env.KLAVIYO_CC_EMAIL || 'cc@yourdomain.com',
                      bcc_email: process.env.KLAVIYO_BCC_EMAIL || 'bcc@yourdomain.com',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    }

    const campaignResponse = await fetch('https://a.klaviyo.com/api/campaigns', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
        'Content-Type': 'application/json',
        'accept': 'application/vnd.api+json',
        'revision': '2025-07-15',
      },
      body: JSON.stringify(campaignData),
    })

    if (!campaignResponse.ok) {
      const errorText = await campaignResponse.text()
      console.error('❌ Failed to create Klaviyo campaign:', campaignResponse.status, errorText)
      return
    }

    const campaign: KlaviyoCampaignResponse = await campaignResponse.json()
    console.log(
      '✅ Created Klaviyo campaign:',
      campaign.data.id,
      'Name:',
      campaign.data.attributes.name,
    )

    // Assign template to campaign message
    console.log('📎 Assigning template to campaign message...')
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const campaignMessageId = campaign.data.relationships['campaign-messages'].data[0].id

    const assignTemplateResponse = await fetch(
      `https://a.klaviyo.com/api/campaign-message-assign-template`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
          'Content-Type': 'application/json',
          'accept': 'application/vnd.api+json',
          'revision': '2025-07-15',
        },
        body: JSON.stringify({
          data: {
            type: 'campaign-message',
            id: campaignMessageId,
            relationships: {
              template: {
                data: {
                  type: 'template',
                  id: template.data.id,
                },
              },
            },
          },
        }),
      },
    )

    if (!assignTemplateResponse.ok) {
      const errorText = await assignTemplateResponse.text()
      console.error(
        '❌ Failed to assign template to campaign:',
        assignTemplateResponse.status,
        errorText,
      )
      throw new Error(`Failed to assign template: ${errorText}`)
    }

    console.log('✅ Template assigned successfully to campaign message')

    // Create marketingCampaign document in Sanity
    console.log('💾 Creating marketingCampaign document in Sanity')
    const marketingCampaignId = `marketingCampaign-${emailId}`

    const newMarketingCampaign = await client.create({
      _id: marketingCampaignId,
      _type: 'marketingCampaign',
      title: `${title} - Marketing Campaign`,
      klaviyoCampaignId: campaign.data.id,
      klaviyoTemplateId: template.data.id,
      status: 'draft',
      email: {_ref: emailId, _type: 'reference'},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: `Marketing campaign for email: ${title}`,
    })

    console.log('✅ Created marketingCampaign document:', newMarketingCampaign._id)

    // Update the post with the marketingCampaign reference
    console.log('🔄 Updating email with marketingCampaign reference')
    await client
      .patch(emailId, {
        set: {
          marketingCampaign: {_ref: newMarketingCampaign._id, _type: 'reference'},
          status: 'ready-for-review',
        },
      })
      .commit()

    console.log('✅ Post updated successfully with marketingCampaign reference')

    console.log('✅ CREATE operation completed:', {
      emailId: emailId,
      marketingCampaignId: newMarketingCampaign._id,
      klaviyoCampaignId: campaign.data.id,
      klaviyoTemplateId: template.data.id,
    })
  } catch (error) {
    console.error('❌ Error in CREATE operation:', error)
    throw error
  }
}

// Handler for UPDATE operation - updates template only
async function handleUpdateOperation(
  client: any,
  emailId: string,
  title: string | undefined,
  slug: {current: string} | undefined,
  klaviyoApiKey: string,
) {
  console.log('🔄 UPDATE: Updating template for existing marketing campaign')

  try {
    // Get the marketing campaign document to find the template ID
    const marketingCampaignQuery = `*[_type == "marketingCampaign" && email._ref == "${emailId}"][0]`
    const marketingCampaignDoc = await client.fetch(marketingCampaignQuery)

    if (!marketingCampaignDoc) {
      console.log('ℹ️ No marketing campaign found for post, skipping update')
      return
    }

    const templateId = marketingCampaignDoc.klaviyoTemplateId
    if (!templateId) {
      console.error('❌ No template ID found in marketing campaign document')
      return
    }

    console.log('📋 Found template ID:', templateId, 'for email:', emailId)

    // Fetch the latest body data for template update
    const {body: bodyData} = await client.fetch(portableTextBodyQuery(emailId))

    // Generate updated email templates
    const htmlContent = await generateEmailTemplate(title, slug?.current, bodyData)
    const textContent = generateTextContent(title, slug?.current)

    // Update the Klaviyo template
    console.log('🔄 Updating Klaviyo template:', templateId)
    const updatedTemplateData = {
      data: {
        type: 'template',
        id: templateId,
        attributes: {
          html: htmlContent,
          text: textContent,
        },
      },
    }

    const updatedTemplateResponse = await fetch(
      `https://a.klaviyo.com/api/templates/${templateId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
          'Content-Type': 'application/json',
          'accept': 'application/vnd.api+json',
          'revision': '2025-07-15',
        },
        body: JSON.stringify(updatedTemplateData),
      },
    )

    if (!updatedTemplateResponse.ok) {
      console.error(
        '❌ Failed to update Klaviyo template:',
        updatedTemplateResponse.status,
        updatedTemplateResponse.statusText,
      )
      return
    }

    console.log('✅ Updated Klaviyo template:', templateId)

    // Reassign the updated template to the campaign to refresh the cache
    const klaviyoCampaignId = marketingCampaignDoc.klaviyoCampaignId
    if (klaviyoCampaignId) {
      console.log('🔄 Reassigning updated template to campaign:', klaviyoCampaignId)

      // Get the campaign message ID from the campaign
      const campaignResponse = await fetch(
        `https://a.klaviyo.com/api/campaigns/${klaviyoCampaignId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Klaviyo-API-Key ${klaviyoApiKey}`,
            accept: 'application/vnd.api+json',
            revision: '2025-07-15',
          },
        },
      )

      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json()
        const campaignMessageId =
          campaignData.data.relationships?.['campaign-messages']?.data?.[0]?.id

        if (campaignMessageId) {
          // Reassign the template to the campaign message
          const assignTemplateResponse = await fetch(
            `https://a.klaviyo.com/api/campaign-message-assign-template`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
                'Content-Type': 'application/json',
                'accept': 'application/vnd.api+json',
                'revision': '2025-07-15',
              },
              body: JSON.stringify({
                data: {
                  type: 'campaign-message',
                  id: campaignMessageId,
                  relationships: {
                    template: {
                      data: {
                        type: 'template',
                        id: templateId,
                      },
                    },
                  },
                },
              }),
            },
          )

          if (assignTemplateResponse.ok) {
            console.log('✅ Successfully reassigned updated template to campaign')
          } else {
            const errorText = await assignTemplateResponse.text()
            console.error(
              '❌ Failed to reassign template to campaign:',
              assignTemplateResponse.status,
              errorText,
            )
          }
        } else {
          console.error('❌ No campaign message ID found in campaign data')
        }
      } else {
        console.error('❌ Failed to fetch campaign data for template reassignment')
      }
    } else {
      console.log('ℹ️ No Klaviyo campaign ID found, skipping template reassignment')
    }

    // Update the marketing campaign document's updatedAt timestamp
    await client
      .patch(marketingCampaignDoc._id, {
        set: {
          updatedAt: new Date().toISOString(),
        },
      })
      .commit()

    console.log('✅ UPDATE operation completed for email:', emailId)
  } catch (error) {
    console.error('❌ Error in UPDATE operation:', error)
    throw error
  }
}

// Helper function to generate email template HTML
async function generateEmailTemplate(
  title: string | undefined,
  slug: string | undefined,
  body: any[] | undefined,
): Promise<string> {
  const emailUrl = slug ? `https://yourdomain.com/emails/${slug}` : '#'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'New Email'}</title>
    <style>
body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}body{margin:0;padding:0;background-color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6}.email-container{max-width:600px;margin:0 auto;background-color:#fff}.header{text-align:center;padding:48px 24px}.logo{font-size:24px;font-weight:700;color:#d97706;letter-spacing:2px;margin-bottom:4px}.logo-subtitle{font-size:12px;color:#6b7280;letter-spacing:3px;margin-bottom:32px}.main-headline{font-size:32px;font-weight:300;color:#111827;margin-bottom:16px;line-height:1.2}.main-description{font-size:16px;color:#6b7280;line-height:1.6;max-width:400px;margin:0 auto}.product-section{padding:0 24px}.product-card{margin-bottom:32px;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}.product-image{width:100%;height:320px;object-fit:contain;display:block}.product-badge{position:absolute;top:16px;left:16px;background-color:#ec4899;color:#fff;padding:4px 12px;font-size:12px;font-weight:500;border-radius:20px}.product-info{padding:24px;background-color:#fff}.product-name{font-size:20px;font-weight:500;color:#111827;margin-bottom:8px}.product-pricing{margin-bottom:16px}.product-price{font-size:20px;font-weight:300;color:#d97706;margin-right:12px}.product-original-price{font-size:16px;color:#6b7280;text-decoration:line-through}.btn{display:inline-block;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;text-align:center;width:100%;box-sizing:border-box}.btn-primary{background-color:#d97706;color:#fff}.btn-outline{background-color:transparent;color:#d97706;border:2px solid #d97706}.btn-secondary{background-color:#ec4899;color:#fff}.collection-cta{padding:48px 24px}.collection-card{background-color:#f9fafb;padding:32px;border-radius:8px;text-align:center}.collection-title{font-size:24px;font-weight:300;color:#111827;margin-bottom:12px}.collection-description{color:#6b7280;margin-bottom:24px;line-height:1.6}.experience-cta{padding:0 24px 48px;text-align:center}.experience-title{font-size:24px;font-weight:300;color:#111827;margin-bottom:12px}.experience-description{color:#6b7280;margin-bottom:24px;line-height:1.6;max-width:400px;margin:0 auto}.footer{padding:32px 24px;border-top:1px solid #e5e7eb;text-align:center}.footer-links{margin-bottom:16px}.footer-link{color:#6b7280;text-decoration:none;margin:0 12px}.footer-text{font-size:12px;color:#6b7280;margin-bottom:8px}.footer-link:hover{color:#ec4899}@media only screen and (max-width:600px){.main-headline{font-size:28px}.product-section{padding:0 16px}.collection-cta,.experience-cta{padding-left:16px;padding-right:16px}}
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">SANITY</div>
            <div class="logo-subtitle">Squiggle Mart</div>
            
            ${toHTML(body || [], {
              components: {
                types: {
                  image: ({value}) => {
                    return `<img src="${value.asset.url}" alt="${value.alt || ''}" style="max-width: 100%; height: auto; margin: 20px 0;" />`
                  },
                  products: ({value}) => {
                    console.log('Products block value:', value)
                    if (!value?.products || !Array.isArray(value.products)) return ''
                    console.log('Products:', value.products)
                    return `
                             <div class="product-section">
                               ${value.products
                                 .map(
                                   (product: any) => `
                                     <div class="product-card">
                                       <div style="position: relative;">
                                         <img src="${product.store.previewImageUrl || ''}" alt="${product.title || 'Product'}" class="product-image">
                                         ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                                       </div>
                                       <div class="product-info">
                                         <h3 class="product-name">${product.store.title || 'Untitled Product'}</h3>
                                         <div class="product-pricing">
                                           <span class="">$${product.store?.priceRange?.minVariantPrice}</span>
                                         </div>
                                         <a href="https://squigglemart.com/products/${product.slug || '#'}" class="btn btn-primary">Shop Now</a>
                                       </div>
                                     </div>
                                   `,
                                 )
                                 .join('')}
                             </div>`
                  },
                },
                marks: {
                  strong: ({children}) => `<strong>${children}</strong>`,
                  em: ({children}) => `<em>${children}</em>`,
                  underline: ({children}) => `<u>${children}</u>`,
                },
                block: {
                  h1: ({children}) =>
                    `<h1 style="font-size: 24px; margin: 24px 0;">${children}</h1>`,
                  h2: ({children}) =>
                    `<h2 style="font-size: 20px; margin: 20px 0;">${children}</h2>`,
                  h3: ({children}) =>
                    `<h3 style="font-size: 18px; margin: 18px 0;">${children}</h3>`,
                  normal: ({children}) =>
                    `<p style="font-size: 16px; line-height: 1.6; margin: 16px 0;">${children}</p>`,
                  blockquote: ({children}) =>
                    `<blockquote style="font-style: italic; margin: 20px 0; padding-left: 20px; border-left: 4px solid #ccc;">${children}</blockquote>`,
                },
              },
            })}
        </div>
        <!-- Collection CTA -->
        <div class="collection-cta">
            <div class="collection-card">
                <h3 class="collection-title">Explore the Complete Collection'</h3>
                <p class="collection-description">
                    Show your love for Squiggle Mart with this limited edition collection.
                </p>
                <a href="https://squigglemart.com/collections/all" class="btn btn-outline">View All Items</a>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-links">
                <a href="https://www.instagram.com/squigglemart" class="footer-link">Instagram</a>
                <a href="https://www.pinterest.com/squigglemart" class="footer-link">Pinterest</a>
                <a href="https://www.facebook.com/squigglemart" class="footer-link">Facebook</a>
            </div>
            <p class="footer-text">© ${new Date().getFullYear()} Sanity. All rights reserved.</p>
            <p class="footer-text">
                You're receiving this because you subscribed to our newsletter. 
                <a href="https://squigglemart.com/unsubscribe" class="footer-link">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
  `
}

// Helper function to generate text content
function generateTextContent(title: string | undefined, slug: string | undefined): string {
  const emailUrl = slug ? `https://yourdomain.com/emails/${slug}` : '#'

  return `
${title || 'New Email'}

We've just published a new email that we think you'll find interesting.

Read more at: ${emailUrl}

Best regards,
Your Team
  `.trim()
}

const portableTextBodyQuery = (emailId: string) => `
  *[_id == "${emailId}"][0]{
    body[]{
      _type,
      _key,
      // Handle image blocks
      _type == "image" => {
        asset->{
          url,
          metadata
        },
        alt
      },
      // Handle product blocks
      _type == "products" => {
        _type,
        products[]->{
          _type,
          ...,
          store
        }
      },
      // Handle text blocks
      _type == "block" => {
        ...,
        children[]{
          ...,
          // Resolve any marks that might have references
          _type == "span" => {
            ...,
            markDefs[]{
              ...,
              _type == "link" => {
                ...,
                internalLink->{
                  _id,
                  _type,
                  title,
                  slug
                }
              }
            }
          }
        }
      }
    }
  }
`
