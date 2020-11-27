import {BifurClient} from '@sanity/bifur-client'
import {Transport} from './transport'
export declare const createBifurTransport: (bifur: BifurClient, sessionId: string) => Transport
