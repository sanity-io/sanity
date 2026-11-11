//! Turns the SVGs in `svg/` (vendored from sanity-io/icons `packages/icons/export` by
//! `scripts/vendor-icons.mjs`) into the `Icon` enum, applying the transforms of that repo's
//! `scripts/generate.ts` so the markup matches what the React components render.

use std::env;
use std::fmt::Write;
use std::fs;
use std::path::Path;

fn pascal_case(name: &str) -> String {
    name.split('-')
        .map(|part| {
            let mut chars = part.chars();
            chars.next().map(|c| c.to_ascii_uppercase().to_string() + chars.as_str()).unwrap_or_default()
        })
        .collect()
}

/// `generate.ts` sizes the icon `1em`, replaces every hex color with `currentColor` and tags
/// the root with `data-sanity-icon`.
fn transform(name: &str, raw: &str) -> String {
    let mut svg = raw
        .lines()
        .map(str::trim)
        .collect::<String>()
        .replace("width=\"25\"", "width=\"1em\"")
        .replace("height=\"25\"", "height=\"1em\"");
    let mut out = String::with_capacity(svg.len());
    while let Some(start) = svg.find("\"#") {
        let hex = &svg[start + 2..];
        let len = hex.find('"').unwrap_or(0);
        out.push_str(&svg[..start]);
        if len == 6 && hex[..6].chars().all(|c| c.is_ascii_hexdigit()) {
            out.push_str("\"currentColor\"");
        } else {
            out.push_str(&svg[start..start + 3 + len]);
        }
        svg = svg[start + 3 + len..].to_owned();
    }
    out.push_str(&svg);
    out.replacen("<svg ", &format!("<svg data-sanity-icon=\"{name}\" "), 1)
}

fn main() {
    let dir = Path::new("svg");
    println!("cargo::rerun-if-changed=svg");

    let mut icons: Vec<(String, String)> = fs::read_dir(dir)
        .expect("svg directory")
        .map(|entry| entry.unwrap().path())
        .filter(|path| path.extension().is_some_and(|ext| ext == "svg"))
        .map(|path| {
            let name = path.file_stem().unwrap().to_str().unwrap().to_owned();
            let svg = transform(&name, &fs::read_to_string(&path).unwrap());
            (name, svg)
        })
        .collect();
    icons.sort();

    let mut code = String::from("#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]\npub enum Icon {\n");
    for (name, _) in &icons {
        writeln!(code, "    {},", pascal_case(name)).unwrap();
    }
    code.push_str("}\n\npub const ALL: &[Icon] = &[\n");
    for (name, _) in &icons {
        writeln!(code, "    Icon::{},", pascal_case(name)).unwrap();
    }
    code.push_str("];\n\nimpl Icon {\n");
    code.push_str("    /// The kebab-case name `@sanity/icons` uses in `data-sanity-icon`.\n");
    code.push_str("    pub fn name(self) -> &'static str {\n        match self {\n");
    for (name, _) in &icons {
        writeln!(code, "            Icon::{} => {name:?},", pascal_case(name)).unwrap();
    }
    code.push_str("        }\n    }\n\n");
    code.push_str("    /// The `<svg>` markup, sized `1em` like the React components.\n");
    code.push_str("    pub fn svg(self) -> &'static str {\n        match self {\n");
    for (name, svg) in &icons {
        writeln!(code, "            Icon::{} => {svg:?},", pascal_case(name)).unwrap();
    }
    code.push_str("        }\n    }\n}\n");

    fs::write(Path::new(&env::var("OUT_DIR").unwrap()).join("icons.rs"), code).unwrap();
}
