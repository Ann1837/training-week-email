export const injurySafetyText =
  "Om höft eller knä börjar göra ont mer än 3/10 under ett pass eller känns sämre dagen efter, kortas nästa löppass med 30–50 % eller ersätts med cykel/gång. Målet är att komma frisk till start, inte att samla flest möjliga kilometer.";

export function buildSafetyTextFooter() {
  return `🩵 Kroppskoll: ${injurySafetyText}`;
}

export function buildSafetyHtmlFooter() {
  return `<div style="margin-top:18px;padding:14px 16px;border-radius:8px;background:#eaf7f4;border:1px solid #8fcfc1;color:#24433d;">
    <p style="margin:0 0 6px;font-weight:bold;">🩵 Kroppskoll</p>
    <p style="margin:0;line-height:1.55;">${escapeHtml(injurySafetyText)}</p>
  </div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
