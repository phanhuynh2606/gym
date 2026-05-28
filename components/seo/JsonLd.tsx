// Escape `<`, `>`, `&`, and U+2028/U+2029 in serialized JSON-LD so that
// user-controlled values (e.g. profile displayName / bio) can't break out
// of the `<script>` tag with an injected `</script>` or HTML entity.
//
// `JSON.stringify` does NOT escape these characters by default, so without
// this step a string like `</script><img src=x onerror=...>` would close
// the script element and execute as HTML.
//
// Standard mitigation per OWASP "DOM-based XSS Prevention".
function escapeForScriptTag(value: object): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeForScriptTag(d) }}
        />
      ))}
    </>
  );
}
