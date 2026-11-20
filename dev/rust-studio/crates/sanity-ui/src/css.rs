//! A lazily filled stylesheet, the role styled-components plays for `@sanity/ui`: a component asks
//! for a class by key, and the rules behind it are inserted the first time the key is used.

use std::cell::RefCell;
use std::collections::HashSet;

use wasm_bindgen::JsCast;
use web_sys::{CssStyleSheet, HtmlStyleElement};

use crate::theme::Theme;

struct Registry {
    sheet: Option<CssStyleSheet>,
    inserted: HashSet<String>,
}

thread_local! {
    static REGISTRY: RefCell<Registry> = RefCell::new(Registry { sheet: None, inserted: HashSet::new() });
    static THEME: Theme = Theme::default();
}

pub fn with_theme<R>(f: impl FnOnce(&Theme) -> R) -> R {
    THEME.with(f)
}

fn sheet() -> Option<CssStyleSheet> {
    let document = web_sys::window()?.document()?;
    let style: HtmlStyleElement = document.create_element("style").ok()?.unchecked_into();
    style.set_attribute("data-sanity-ui", "").ok()?;
    document.head()?.append_child(&style).ok()?;
    style.sheet()?.dyn_into().ok()
}

/// Returns `class`, inserting the rules `build` returns the first time the class is requested.
/// Rules use `&` for the class selector.
pub fn class(class: String, build: impl FnOnce() -> Vec<String>) -> String {
    REGISTRY.with(|registry| {
        let mut registry = registry.borrow_mut();
        if registry.inserted.contains(&class) {
            return;
        }
        if registry.sheet.is_none() {
            registry.sheet = sheet();
        }
        let selector = format!(".{class}");
        if let Some(sheet) = &registry.sheet {
            for rule in build() {
                let rule = rule.replace('&', &selector);
                let index = sheet.css_rules().map(|rules| rules.length()).unwrap_or(0);
                // Engines reject the vendor pseudo-elements of other engines (`::-moz-focus-inner`).
                let vendor = rule.contains("::-moz-") || rule.contains("::-webkit-");
                if let Err(err) = sheet.insert_rule_with_index(&rule, index)
                    && !vendor
                {
                    web_sys::console::warn_2(&"Invalid CSS rule".into(), &format!("{rule}: {err:?}").into());
                }
            }
        }
        registry.inserted.insert(class.clone());
    });
    class
}

/// Inserts global rules once under `key`.
pub fn global(key: &str, build: impl FnOnce() -> Vec<String>) {
    class(format!("global-{key}"), build);
}
