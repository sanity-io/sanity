//! `Badge`, `Spinner`, `Avatar` and `Skeleton`.

use leptos::prelude::*;
use sanity_color::Hue;

use crate::layout::{Pad, radius};
use crate::styles::{FontKind, badge_class, font_class, skeleton_class};
use crate::text::{Icon, IconName, Text};
use crate::theme::{AVATAR_SIZES, FontWeight, StateTone, rem};

#[component]
pub fn Badge(
    #[prop(optional)] tone: Option<StateTone>,
    #[prop(optional, into)] padding: Option<Pad>,
    #[prop(optional)] font_size: Option<usize>,
    #[prop(optional, into)] title: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let tone = tone.unwrap_or(StateTone::Default);
    let style = padding.unwrap_or(Pad::all(1)).css();
    view! {
        <div data-ui="Badge" class=badge_class(tone) style=style title=move || title.get()>
            <Text size=font_size.unwrap_or(1)>{children()}</Text>
        </div>
    }
}

#[component]
pub fn Spinner(#[prop(optional)] size: Option<usize>, #[prop(optional)] muted: Option<bool>) -> impl IntoView {
    view! {
        <span
            data-ui="Spinner"
            class=font_class(FontKind::Text, size.unwrap_or(2), FontWeight::Regular)
            data-muted=muted.unwrap_or(true).then_some("")
        >
            <span>
                <Icon icon=IconName::Spinner style="animation: sanity-ui-spin 500ms linear infinite;" />
            </span>
        </span>
    }
}

/// The color `@sanity/ui`'s `Avatar` picks for a user id: a stable hash into the hues.
pub fn avatar_hue(id: &str) -> Hue {
    const HUES: [Hue; 7] = [Hue::Blue, Hue::Cyan, Hue::Green, Hue::Yellow, Hue::Orange, Hue::Red, Hue::Purple];
    let hash = id.bytes().fold(0u32, |hash, byte| hash.wrapping_mul(31).wrapping_add(byte as u32));
    HUES[hash as usize % HUES.len()]
}

#[component]
pub fn Avatar(
    #[prop(optional, into)] src: MaybeProp<String>,
    #[prop(into)] initials: String,
    #[prop(optional)] hue: Option<Hue>,
    #[prop(optional)] size: Option<usize>,
    #[prop(optional, into)] title: MaybeProp<String>,
) -> impl IntoView {
    let px = AVATAR_SIZES[size.unwrap_or(1).min(AVATAR_SIZES.len() - 1)] as f64;
    let hue = hue.unwrap_or(Hue::Gray).name();
    let style = format!(
        "position: relative; flex: none; width: {size}; height: {size}; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: var(--card-avatar-{hue}-bg-color); color: var(--card-avatar-{hue}-fg-color); box-shadow: 0 0 0 1px var(--card-bg-color);",
        size = rem(px)
    );
    let text_size = if px > 30.0 { 1 } else { 0 };
    view! {
        <div data-ui="Avatar" style=style title=move || title.get()>
            {move || match src.get() {
                Some(src) if !src.is_empty() => {
                    view! { <img src=src alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" /> }
                        .into_any()
                }
                _ => {
                    view! {
                        <span class=font_class(FontKind::Text, text_size, FontWeight::Medium) style="color: inherit;">
                            <span>{initials.clone()}</span>
                        </span>
                    }
                        .into_any()
                }
            }}
        </div>
    }
}

#[component]
pub fn Skeleton(
    #[prop(optional, into)] width: Option<String>,
    #[prop(optional, into)] height: Option<String>,
    #[prop(optional)] radius: Option<usize>,
) -> impl IntoView {
    let style = format!(
        "width: {}; height: {}; border-radius: {};",
        width.unwrap_or_else(|| "100%".into()),
        height.unwrap_or_else(|| "0.75rem".into()),
        self::radius(radius.unwrap_or(1))
    );
    view! { <div data-ui="Skeleton" class=skeleton_class() style=style></div> }
}
