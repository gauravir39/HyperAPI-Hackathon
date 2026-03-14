export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function parseCurrency(value) {
  const cleaned = String(value ?? "").replace(/[$,%]/g, "").replaceAll(",", "").trim();
  const numeric = Number.parseFloat(cleaned);
  return Number.isNaN(numeric) ? 0 : numeric;
}

export function parsePages(value) {
  return String(value ?? "")
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map((entry) => Number.parseInt(entry.trim(), 10));
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
          return [];
        }

        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
      }

      const page = Number.parseInt(trimmed, 10);
      return Number.isNaN(page) ? [] : [page];
    });
}

export function parseDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isInvalidCalendarDate(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return true;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  );
}

export function hasDuplicateLineItems(items) {
  const seen = new Set();
  return items.some((item) => {
    const normalized = normalizeText(item);
    if (seen.has(normalized)) {
      return true;
    }

    seen.add(normalized);
    return false;
  });
}

export function createSimilarityScore(left, right) {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) {
    return 0;
  }

  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;
  let matches = 0;

  for (const character of shorter) {
    if (longer.includes(character)) {
      matches += 1;
    }
  }

  return matches / longer.length;
}

export function isSoftVendorNameMismatch(left, right) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight || normalizedLeft === normalizedRight) {
    return false;
  }

  const similarity = createSimilarityScore(normalizedLeft, normalizedRight);
  return similarity >= 0.78;
}

export function getVendorByName(vendors, vendorName) {
  return vendors.find((vendor) => normalizeText(vendor.vendorName) === normalizeText(vendorName)) ?? null;
}
