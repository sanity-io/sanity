import {documentEventHandler, type DocumentEvent} from '@sanity/functions'
import {createClient} from '@sanity/client'

interface MarketingCampaignDocument {
  _id: string
  _type: string
  klaviyoCampaignId?: string
  email?: {
    _ref: string
  }
  status?: string
}

interface KlaviyoSendJobResponse {
  data: {
    id: string
    type: string
    attributes: {
      status: string
    }
  }
}

export const handler = documentEventHandler(
  async ({context, event}: {context: any; event: DocumentEvent<MarketingCampaignDocument>}) => {
    console.log('🚀 Marketing Campaign Send Function called at', new Date().toISOString())
    console.log('🚀 Event:', event)

    try {
      const {_id, _type, klaviyoCampaignId, email} = event.data as MarketingCampaignDocument

      // Get Klaviyo API credentials from environment
      const klaviyoApiKey = process.env.KLAVIYO_API_KEY

      if (!klaviyoApiKey) {
        console.error('❌ KLAVIYO_API_KEY not found in environment variables')
        return
      }

      if (_type !== 'marketingCampaign') {
        console.log('⏭️ Skipping non-marketingCampaign document:', _type)
        return
      }

      // Check if marketing campaign has a email reference
      if (!email?._ref) {
        console.log('⏭️ Marketing campaign does not have a email reference - skipping')
        return
      }

      const client = createClient({
        ...context.clientOptions,
        dataset: 'production',
        apiVersion: '2025-06-01',
      })

      // Get the email document from the marketing campaign reference
      const emailId = email._ref
      const emailDocument = await client.getDocument(emailId)

      if (!emailDocument) {
        console.error('❌ Email document not found:', emailId)
        return
      }

      if (!klaviyoCampaignId) {
        console.error('❌ Klaviyo campaign ID not found in marketing campaign document')
        return
      }

      console.log('📢 Sending Klaviyo campaign:', klaviyoCampaignId)

      try {
        // Send the campaign using Klaviyo's send endpoint
        const sendCampaignResponse = await fetch(`https://a.klaviyo.com/api/campaign-send-jobs`, {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
            'Content-Type': 'application/json',
            'accept': 'application/vnd.api+json',
            'revision': '2025-07-15',
          },
          body: JSON.stringify({
            data: {
              type: 'campaign-send-job',
              id: klaviyoCampaignId,
            },
          }),
        })

        if (!sendCampaignResponse.ok) {
          const errorText = await sendCampaignResponse.text()
          console.error(
            '❌ Failed to send Klaviyo campaign:',
            sendCampaignResponse.status,
            errorText,
          )

          // Handle specific error cases
          if (sendCampaignResponse.status === 429) {
            console.error('❌ Rate limit exceeded. Klaviyo allows 10/s burst, 150/m steady')
          } else if (sendCampaignResponse.status === 400) {
            console.error('❌ Bad request. Check campaign data format')
          } else if (sendCampaignResponse.status === 403) {
            console.error(
              '❌ Forbidden. Check API key permissions (campaigns:write scope required)',
            )
          } else if (sendCampaignResponse.status === 422) {
            console.error('❌ Unprocessable entity. Campaign may not be ready to send')
          }
          return
        }

        const sendJobResponse: KlaviyoSendJobResponse = await sendCampaignResponse.json()
        console.log('✅ Campaign send job created successfully:', sendJobResponse.data.id)

        // Update the marketing campaign document status to 'sent'
        console.log('🔄 Updating marketing campaign status to sent')
        await client
          .patch(_id, {
            set: {
              status: 'sent',
              sentAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          })
          .commit()

        console.log('✅ Marketing campaign status updated to sent')

        // Update the email status to 'sent' (this should not trigger further updates)
        console.log('🔄 Updating email status to sent')
        await client
          .patch(emailId, {
            set: {
              status: 'sent',
            },
          })
          .commit()

        console.log('✅ Email status updated to sent')

        console.log('✅ Campaign send completed successfully:', {
          emailId: emailId,
          marketingCampaignId: _id,
          klaviyoCampaignId: klaviyoCampaignId,
          sendJobId: sendJobResponse.data.id,
        })
      } catch (error) {
        console.error('❌ Error sending Klaviyo campaign:', error)
        throw error
      }
    } catch (error) {
      console.error('❌ Error processing campaign send:', error)
      throw error
    }
  },
)
