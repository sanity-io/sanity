/**
 * This script takes the import map from the `#__imports` script tag,
 * modifies relevant URLs that match the sanity-cdn hostname by replacing
 * the existing timestamp in the sanity-cdn URLs with a new runtime timestamp,
 * and injects the modified import map back into the HTML.
 *
 * This will be injected into the HTML of the user's bundle.
 *
 * Note that this is in a separate constants file to prevent "Cannot access
 * before initialization" errors.
 */
export const TIMESTAMPED_IMPORTMAP_INJECTOR_SCRIPT = `<script>
  // auto-generated script to add import map with timestamp
  const importsJson = document.getElementById('__imports')?.textContent;
  const { imports = {}, ...rest } = importsJson ? JSON.parse(importsJson) : {};
  const importMapEl = document.createElement('script');
  importMapEl.type = 'importmap';
  const newTimestamp = \`/t\${Math.floor(Date.now() / 1000)}\`;
  importMapEl.textContent = JSON.stringify({
    imports: Object.fromEntries(
      Object.entries(imports).map(([specifier, path]) => {
        try {
          const url = new URL(path);
          if (/^sanity-cdn\\.[a-zA-Z]+$/.test(url.hostname)) {
            url.pathname = url.pathname.replace(/\\/t\\d+/, newTimestamp);
          }
          return [specifier, url.toString()];
        } catch {
          return [specifier, path];
        }
      })
    ),
    ...rest,
  });
  document.head.appendChild(importMapEl);
</script>`
