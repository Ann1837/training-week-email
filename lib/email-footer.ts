export const injurySafetyText =
  "Om höft eller knä börjar göra ont mer än 3/10 under ett pass eller känns sämre dagen efter, kortas nästa löppass med 30–50 % eller ersätts med cykel/gång. Målet är att komma frisk till start, inte att samla flest möjliga kilometer.";

const confidenceBoosts = [
  "Du bygger formen med varje smart beslut. Ett bra pass är inte alltid det hårdaste passet – det är passet som gör dig starkare, tryggare och redo för nästa steg.",
  "Det är kontinuiteten som gör jobbet. En lugn kilometer, ett klokt val och en bra natts sömn räknas också.",
  "Du behöver inte bevisa något för passet. Du ska använda passet för att bli lite mer redo.",
  "Starkt är också att hålla igen när kroppen ber om det. Smart träning är självförtroende i praktiken.",
  "Du tränar inte för att vinna varje dag. Du tränar för att stå på startlinjen med kroppen med dig.",
  "Varje vecka du håller ihop planen bygger mer än kondition. Den bygger tillit till att du klarar det här.",
  "Du är redan på väg. Gör dagens pass med närvaro, inte stress, så följer formen efter.",
  "Bra träning känns inte alltid dramatisk. Ofta är det bara du som gör jobbet, om och om igen, och det räcker långt."
];

export function buildConfidenceTextFooter(now = new Date()) {
  return `✨ Pepp: ${getWeeklyConfidenceBoost(now)}`;
}

export function buildConfidenceHtmlFooter(now = new Date()) {
  const confidenceBoostText = getWeeklyConfidenceBoost(now);

  return `<div style="margin-top:18px;padding:14px 16px;border-radius:8px;background:#fff1e8;border:1px solid #f0b58d;color:#533325;">
    <p style="margin:0 0 6px;font-weight:bold;">✨ Pepp</p>
    <p style="margin:0;line-height:1.55;">${escapeHtml(confidenceBoostText)}</p>
  </div>`;
}

function getWeeklyConfidenceBoost(now: Date) {
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - startOfYear) / 86400000);
  const weekIndex = Math.floor(dayOfYear / 7);

  return confidenceBoosts[weekIndex % confidenceBoosts.length];
}

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
