import {type PortableTextBlock} from '../portableText'
import {type User} from '../user'

/**
 * @internal
 * Payload that will be passed by the comments backend to our notifications system to display the notification in dashboard.
 * */
export interface StudioNotificationPayload extends DashboardNotificationPayload {
  applicationType: 'studio'
  applicationId: string | undefined
  workspaceName: string | undefined
  link: {
    type: 'url'
    url: string
  }
}

/**
 * @internal
 * Payload that will be passed by canvas to our notifications system to display the notification in canvas.
 * */
export interface CanvasNotificationPayload extends DashboardNotificationPayload {
  applicationType: 'canvas'
  link: {
    type: 'dashboard'
    path: string
  }
}

/**
 * @internal
 * Payload notifications have to provide to the notification system in order to display correctly in dashboard
 */
export interface DashboardNotificationPayload {
  version: '1.0.0'
  applicationType: string
  createdAt: string
  /**
   * The user who took the action which triggered the notification.
   */
  actor: User
  title: PortableTextBlock[]
  body: PortableTextBlock[] | undefined
  organizationId: string
  applicationId?: string
  workspaceName?: string
  link:
    | {
        type: 'url'
        url: string
      }
    | {
        type: 'dashboard'
        path: string
      }
}
