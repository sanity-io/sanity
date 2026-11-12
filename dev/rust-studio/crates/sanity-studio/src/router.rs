//! Routes with the JS structure tool's shape (`/<workspace>/structure/<type>;<id>`), under
//! `BASE_PATH`, on the History API.

use leptos::ev;
use leptos::prelude::*;

use crate::config::{BASE_PATH, WORKSPACE};
use crate::releases::{self, with_perspective};

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Route {
    pub type_name: Option<String>,
    pub document_id: Option<String>,
}

impl Route {
    pub fn parse(pathname: &str) -> Route {
        let prefix = format!("{BASE_PATH}/{WORKSPACE}/structure");
        let Some(rest) = pathname.strip_prefix(&prefix) else { return Route::default() };
        let mut segments = rest.trim_matches('/').split('/').filter(|segment| !segment.is_empty());
        let Some(pane) = segments.next() else { return Route::default() };
        let mut parts = pane.splitn(2, ';');
        let type_name = parts.next().filter(|name| !name.is_empty()).map(percent_decode);
        let document_id = parts.next().filter(|id| !id.is_empty()).map(percent_decode);
        Route { type_name, document_id }
    }

    pub fn href(&self) -> String {
        let mut href = format!("{BASE_PATH}/{WORKSPACE}/structure");
        if let Some(type_name) = &self.type_name {
            href.push('/');
            href.push_str(type_name);
            if let Some(id) = &self.document_id {
                href.push(';');
                href.push_str(id);
            }
        }
        href
    }

    /// The same location in the JS studio, for comparing the two.
    pub fn js_studio_href(&self) -> String {
        self.href().trim_start_matches(BASE_PATH).to_owned()
    }

    pub fn list(type_name: &str) -> Route {
        Route { type_name: Some(type_name.to_owned()), document_id: None }
    }

    pub fn document(type_name: &str, id: &str) -> Route {
        Route { type_name: Some(type_name.to_owned()), document_id: Some(id.to_owned()) }
    }
}

fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%'
            && let Some(byte) = input.get(index + 1..index + 3).and_then(|hex| u8::from_str_radix(hex, 16).ok())
        {
            out.push(byte);
            index += 3;
        } else {
            out.push(bytes[index]);
            index += 1;
        }
    }
    String::from_utf8(out).unwrap_or_else(|_| input.to_owned())
}

#[derive(Clone, Copy)]
pub struct Router {
    pub route: RwSignal<Route>,
}

fn current_pathname() -> String {
    window().location().pathname().unwrap_or_default()
}

impl Router {
    pub fn install() -> Router {
        let route = RwSignal::new(Route::parse(&current_pathname()));
        let router = Router { route };
        if !current_pathname().starts_with(&format!("{BASE_PATH}/{WORKSPACE}/structure")) {
            // Keeps the query and the hash, where a login hands over the credentials `auth` reads.
            let location = window().location();
            let search = location.search().unwrap_or_default();
            let hash = location.hash().unwrap_or_default();
            let _ = window().history().and_then(|history| {
                history.replace_state_with_url(
                    &wasm_bindgen::JsValue::NULL,
                    "",
                    Some(&format!("{}{search}{hash}", Route::default().href())),
                )
            });
            route.set(Route::default());
        }
        let handle = window_event_listener(ev::popstate, move |_| {
            releases::sync_from_url();
            route.set(Route::parse(&current_pathname()));
        });
        on_cleanup(move || handle.remove());
        provide_context(router);
        router
    }

    pub fn navigate(&self, route: &Route) {
        if self.route.get_untracked() == *route {
            return;
        }
        let _ = window().history().and_then(|history| {
            history.push_state_with_url(&wasm_bindgen::JsValue::NULL, "", Some(&with_perspective(&route.href())))
        });
        self.route.set(route.clone());
    }

    pub fn replace(&self, route: &Route) {
        let _ = window().history().and_then(|history| {
            history.replace_state_with_url(&wasm_bindgen::JsValue::NULL, "", Some(&with_perspective(&route.href())))
        });
        self.route.set(route.clone());
    }
}

pub fn use_router() -> Router {
    expect_context::<Router>()
}

/// A click handler for links rendered with `href`: plain clicks navigate in place, modified
/// clicks (new tab, …) are left to the browser.
pub fn link_click(router: Router, route: Route) -> impl Fn(web_sys::MouseEvent) + Clone + Send + Sync + 'static {
    move |event: web_sys::MouseEvent| {
        if event.meta_key() || event.ctrl_key() || event.shift_key() || event.alt_key() || event.button() != 0 {
            return;
        }
        event.prevent_default();
        router.navigate(&route);
    }
}

#[cfg(test)]
mod tests {
    use super::Route;

    #[test]
    fn round_trips_structure_paths() {
        let route = Route::document("author", "abc-123");
        assert_eq!(route.href(), "/rust/test/structure/author;abc-123");
        assert_eq!(route.js_studio_href(), "/test/structure/author;abc-123");
        assert_eq!(Route::parse("/rust/test/structure/author;abc-123"), route);
        assert_eq!(Route::parse("/rust/test/structure/author"), Route::list("author"));
        assert_eq!(Route::parse("/rust/test/structure"), Route::default());
        assert_eq!(Route::parse("/rust/"), Route::default());
        assert_eq!(Route::parse("/rust/test/structure/a%3Bb;c%20d"), Route::document("a;b", "c d"));
    }
}
