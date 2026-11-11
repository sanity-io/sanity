//! The project the studio edits: the test studio's `test` workspace.

pub const PROJECT_ID: &str = "ppsg7ml5";
pub const DATASET: &str = "test";
pub const API_HOST: &str = "api.sanity.io";
pub const WORKSPACE: &str = "test";
pub const WORKSPACE_TITLE: &str = "Test Studio";
/// Where the app is served from, next to the JS studio's workspaces.
pub const BASE_PATH: &str = "/rust";
/// Where the JS studio keeps its token, which the Rust studio shares on the same origin.
pub const TOKEN_KEY: &str = "__studio_auth_token_ppsg7ml5";
pub const REQUEST_TAG_PREFIX: &str = "sanity.studio.rust";
