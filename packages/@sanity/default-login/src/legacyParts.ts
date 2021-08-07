// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import BrandLogo from 'part:@sanity/base/brand-logo?'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import pluginConfig from 'config:@sanity/default-login'
import LoginDialogContent from 'part:@sanity/base/login-dialog-content'
import userStore from 'part:@sanity/base/user'
import LoginDialog from 'part:@sanity/base/login-dialog'

export {BrandLogo, authenticationFetcher, pluginConfig, LoginDialogContent, userStore, LoginDialog}
