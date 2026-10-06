/**
 * Format custom User ID (TSC-YYAANNNN) and Company ID (CID-YYAANNNN)
 * Format: PREFIX-YYAANNNN
 * - YY: 2 digits representing year (e.g. 26)
 * - AA: Series from AA to ZZ (each AA holds 9999 items)
 * - NNNN: 4-digit serial from 0001 to 9999
 */

export function generateCustomId(
  prefix: "TSC" | "CID",
  item?: { id?: string; role?: string; custom_id?: string; created_at?: string | Date } | null,
  indexInList?: number
): string {
  if (!item) {
    return `${prefix}-26AA0001`;
  }

  // Super Admin override for User ID
  if (prefix === "TSC" && item.role === "Super Admin") {
    return "TSC-000000";
  }

  // If item already has a valid custom_id matching our format, use it
  if (item.custom_id && /^(TSC|CID)-\d{2}[A-Z]{2}\d{4}$/.test(item.custom_id)) {
    return item.custom_id;
  }

  const createdDate = item.created_at ? new Date(item.created_at) : new Date();
  const year = isNaN(createdDate.getTime()) ? new Date().getFullYear() : createdDate.getFullYear();
  const yy = String(year).slice(-2);

  let n = 1;
  if (indexInList !== undefined && indexInList >= 0) {
    n = indexInList + 1;
  } else if (item.id) {
    const hexPart = String(item.id).replace(/-/g, "").substring(0, 6);
    const parsed = parseInt(hexPart, 16);
    n = isNaN(parsed) ? 1 : (parsed % 9999) + 1;
  }

  const seriesIdx = Math.floor((n - 1) / 9999);
  const char1 = String.fromCharCode(65 + Math.floor(seriesIdx / 26));
  const char2 = String.fromCharCode(65 + (seriesIdx % 26));

  const numPart = String(((n - 1) % 9999) + 1).padStart(4, "0");

  return `${prefix}-${yy}${char1}${char2}${numPart}`;
}

export function formatUserId(user?: { id?: string; role?: string; custom_id?: string; created_at?: string | Date } | null, indexInList?: number): string {
  return generateCustomId("TSC", user, indexInList);
}

export function formatCompanyId(companyOrId?: { id?: string; custom_id?: string; created_at?: string | Date } | string | null, indexInList?: number): string {
  if (!companyOrId) return "—";
  if (typeof companyOrId === "string") {
    return generateCustomId("CID", { id: companyOrId }, indexInList);
  }
  return generateCustomId("CID", companyOrId, indexInList);
}
