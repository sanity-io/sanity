//! Portable Text renders read-only: blocks with their styles, lists and decorators, and a link to
//! edit the field in the JS studio. Editing it needs a port of the Portable Text editor.

use leptos::prelude::*;
use sanity_ui::prelude::*;
use serde_json::Value;

use super::Target;
use crate::router::use_router;

fn span_style(marks: &[&str], annotated: bool) -> String {
    let mut style = String::new();
    for mark in marks {
        style.push_str(match *mark {
            "strong" => "font-weight: 600;",
            "em" => "font-style: italic;",
            "underline" => "text-decoration: underline;",
            "strike-through" => "text-decoration: line-through;",
            "code" => "font-family: var(--font-code-family, monospace); background-color: var(--card-code-bg-color); color: var(--card-code-fg-color); border-radius: 2px; padding: 0 2px;",
            _ => "",
        });
    }
    if annotated {
        style.push_str("color: var(--card-link-fg-color); text-decoration: underline;");
    }
    style
}

fn render_block(block: &Value) -> AnyView {
    let type_name = block.get("_type").and_then(Value::as_str).unwrap_or_default();
    if type_name != "block" {
        let label = format!("{} block", crate::util::start_case(type_name));
        return view! {
            <Card border=true radius=2 padding=Pad::all(2) tone=CardTone::Transparent>
                <Text size=1 muted=true>{label}</Text>
            </Card>
        }
        .into_any();
    }
    let annotation_keys: Vec<&str> = block
        .get("markDefs")
        .and_then(Value::as_array)
        .map(|defs| defs.iter().filter_map(|def| def.get("_key").and_then(Value::as_str)).collect())
        .unwrap_or_default();
    let spans: Vec<AnyView> = block
        .get("children")
        .and_then(Value::as_array)
        .map(|children| {
            children
                .iter()
                .map(|child| {
                    let text = child.get("text").and_then(Value::as_str).unwrap_or_default().to_owned();
                    let marks: Vec<&str> = child
                        .get("marks")
                        .and_then(Value::as_array)
                        .map(|marks| marks.iter().filter_map(Value::as_str).collect())
                        .unwrap_or_default();
                    let annotated = marks.iter().any(|mark| annotation_keys.contains(mark));
                    view! { <span style=span_style(&marks, annotated)>{text}</span> }.into_any()
                })
                .collect()
        })
        .unwrap_or_default();
    let style = block.get("style").and_then(Value::as_str).unwrap_or("normal");
    let (size, weight) = match style {
        "h1" => (4, "700"),
        "h2" => (3, "700"),
        "h3" => (2, "700"),
        "h4" | "h5" | "h6" => (1, "700"),
        _ => (1, "400"),
    };
    let level = block.get("level").and_then(Value::as_u64).unwrap_or(1).max(1) as usize;
    let list = block.get("listItem").and_then(Value::as_str);
    let bullet = match list {
        Some("number") => Some("1."),
        Some(_) => Some("•"),
        None => None,
    };
    let quote = style == "blockquote";
    let indent =
        if list.is_some() { format!("padding-left: {}rem;", level as f32 * 1.25 - 1.25) } else { String::new() };
    let quote_style =
        if quote { "border-left: 2px solid var(--card-border-color); padding-left: 0.75rem;" } else { "" };
    view! {
        <div style=format!("display: flex; gap: 0.5rem; {indent} {quote_style}")>
            {bullet.map(|bullet| view! { <Text size=1 muted=true>{bullet}</Text> })}
            <div style=format!("font-weight: {weight}; flex: 1; min-width: 0;")>
                <Text size=size muted=quote>
                    {spans}
                </Text>
            </div>
        </div>
    }
    .into_any()
}

#[component]
pub fn PortableTextPreview(target: Target) -> impl IntoView {
    let router = use_router();
    let js_href = move || router.route.with(|route| route.js_studio_href());
    let blocks = move || {
        let value = target.value();
        let blocks = value.as_ref().and_then(Value::as_array).cloned().unwrap_or_default();
        if blocks.is_empty() {
            return view! { <Text size=1 muted=true>"Empty"</Text> }.into_any();
        }
        blocks.iter().take(200).map(render_block).collect_view().into_any()
    };
    view! {
        <Card border=true radius=2>
            <Stack space=4 padding=Pad::all(3) style="max-height: 24rem; overflow: auto;">
                {blocks}
            </Stack>
            <Card border_top=true padding=Pad::all(2) tone=CardTone::Transparent>
                <Flex align="center" gap=2>
                    <Box flex=1>
                        <Text size=1 muted=true>"Portable Text editing isn't ported to the Rust studio yet."</Text>
                    </Box>
                    <Button
                        mode=ButtonMode::Ghost
                        text="Edit in JS studio"
                        icon_right=IconName::Launch
                        font_size=1
                        padding=Pad::xy(2, 2)
                        href=Signal::derive(js_href)
                        target="_blank"
                    />
                </Flex>
            </Card>
        </Card>
    }
}

pub fn unsupported_block() -> AnyView {
    view! { <Text size=1 muted=true>"Blocks outside an array can't be edited."</Text> }.into_any()
}
