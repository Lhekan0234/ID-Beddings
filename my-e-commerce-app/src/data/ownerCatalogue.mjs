// =============================================================================
// OWNER-SUPPLIED CATALOGUE — transcribed exactly from the price list image
// =============================================================================
// Source: price list supplied by the business owner on 2026-11-24.
//
// Rules followed here (prd/agent.md 2.7, 5):
//   * Every label and price below comes from the owner's list. Nothing invented.
//   * Each size row is its own product because the owner quotes one unit price
//     per size. The current product model has a single `price` field, so
//     grouping sizes would force us to guess a price for the other sizes.
//   * "PILLOW TOP ROYAL FIRM" dimensions were cut off in the image; the ellipsis
//     is preserved exactly rather than completed with a guessed size.
//   * "MONDEO SPRING FIRM" had no visible rows, so it is not included at all.
//   * Firmness/audience are only set where the owner's own wording supports
//     them. Everything else stays unknown rather than assumed.
//
// `collection` is the storefront placement chosen by the developer using the
// owner's existing seven collections; `tier` is the owner's own price group.
// =============================================================================

export const priceTiers = ['LUXURY', 'COMFORT', 'VALUE'];

/**
 * rows: [exact product label from price sheet, size shown on the sheet, whole NGN]
 */
export const ownerLines = [
  // ---------------------------------------------------------------- LUXURY --
  {
    line: 'WELLBEING REGAL',
    tier: 'LUXURY',
    collection: 'luxury-sleep',
    image: 'wellbeing-regal',
    rows: [
      ['REGAL (75X42X8)', '75X42X8', 214991],
      ['REGAL (75X54X8)', '75X54X8', 284695],
      ['REGAL (75X54X10)', '75X54X10', 345521],
      ['REGAL (75X60X8)', '75X60X8', 307122],
      ['REGAL (75X72X8)', '75X72X8', 379608],
      ['REGAL (75X72X10)', '75X72X10', 468314],
      ['REGAL (75X84X8)', '75X84X8', 426238],
      ['REGAL (75X84X10)', '75X84X10', 558958],
    ],
  },
  {
    line: 'WELLBEING REGINA',
    tier: 'LUXURY',
    collection: 'luxury-sleep',
    image: 'wellbeing-regina',
    rows: [
      ['REGINA (75X42X8)', '75X42X8', 135656],
      ['REGINA (75X54X8)', '75X54X8', 183139],
      ['REGINA (75X54X10)', '75X54X10', 216522],
      ['REGINA (75X60X8)', '75X60X8', 185154],
      ['REGINA (75X72X8)', '75X72X8', 231462],
      ['REGINA (75X72X10)', '75X72X10', 295071],
      ['REGINA (75X72X12)', '75X72X12', 333315],
      ['REGINA (75X84X8)', '75X84X8', 271317],
      ['REGINA (75X84X10)', '75X84X10', 351064],
      ['REGINA (84X84X8)', '84X84X8', 283428],
      ['REGINA (84X84X10)', '84X84X10', 362337],
    ],
  },
  {
    line: 'WELLBEING REGAL PLUS',
    tier: 'LUXURY',
    collection: 'luxury-sleep',
    image: 'wellbeing-regal-plus',
    rows: [
      ['REGAL PLUS (75X54X10)', '75X54X10', 414628],
      ['REGAL PLUS (75X72X10)', '75X72X10', 561973],
      ['REGAL PLUS (75X84X10)', '75X84X10', 670748],
    ],
  },
  {
    line: 'PILLOW TOP ROYAL',
    tier: 'LUXURY',
    collection: 'luxury-sleep',
    image: 'pillow-top-royal',
    rows: [
      ['PILLOW TOP ROYAL (75X54X12)', '75X54X12', 493405],
      ['PILLOW TOP ROYAL (75X72X12)', '75X72X12', 704866],
      ['PILLOW TOP ROYAL (75X84X12)', '75X84X12', 775350],
      ['PILLOW TOP ROYAL (79X60X12)', '79X60X12', 704866],
      ['PILLOW TOP ROYAL (79X71X12)', '79X71X12', 775350],
    ],
  },
  {
    line: 'PILLOW TOP ROYAL FIRM',
    tier: 'LUXURY',
    collection: 'orthopedic-collection',
    image: 'pillow-top-royal-firm',
    firmness: ['Firm'],
    rows: [
      // The trailing dimension was cut off in the owner's image. Keep it as-is.
      ['PILLOW TOP ROYAL FIRM (75X54X...)', '75X54X...', 595395],
      ['PILLOW TOP ROYAL FIRM (75X72X...)', '75X72X...', 775351],
      ['PILLOW TOP ROYAL FIRM (75X84X...)', '75X84X...', 874809],
    ],
  },
  {
    line: 'WELLBEING TOPPER',
    tier: 'LUXURY',
    collection: 'luxury-sleep',
    image: 'wellbeing-topper',
    rows: [
      ['WELLBEING TOPPER 75X54X2', '75X54X2', 106389],
      ['WELLBEING TOPPER 75X72X2', '75X72X2', 139087],
      ['WELLBEING TOPPER 75X84X2', '75X84X2', 161197],
    ],
  },

  // ---------------------------------------------------------------- COMFORT --
  {
    line: 'FLORA',
    tier: 'COMFORT',
    collection: 'better-sleep',
    image: 'flora',
    rows: [
      ['FLORA (75X30X3)', '75X30X3', 24598],
      ['FLORA (75X30X4)', '75X30X4', 32810],
      ['FLORA (75X30X6)', '75X30X6', 49185],
      ['FLORA (75X36X6)', '75X36X6', 59025],
      ['FLORA (75X36X8)', '75X36X8', 78706],
      ['FLORA (75X42X6)', '75X42X6', 68876],
      ['FLORA (75X42X8)', '75X42X8', 87292],
      ['FLORA (75X48X8)', '75X48X8', 104940],
      ['FLORA (75X54X6)', '75X54X6', 89234],
      ['FLORA (75X54X8)', '75X54X8', 126051],
      ['FLORA (75X54X10)', '75X54X10', 157588],
      ['FLORA (75X54X12)', '75X54X12', 185405],
      ['FLORA (75X54X14)', '75X54X14', 192493],
      ['FLORA (75X54X16)', '75X54X16', 233868],
      ['FLORA (75X54X18)', '75X54X18', 243304],
      ['FLORA (75X54X20)', '75X54X20', 290683],
      ['FLORA (75X72X8)', '75X72X8', 157409],
      ['FLORA (75X72X10)', '75X72X10', 210129],
      ['FLORA (75X72X12)', '75X72X12', 238187],
      ['FLORA (75X72X14)', '75X72X14', 250598],
      ['FLORA (75X72X16)', '75X72X16', 297412],
      ['FLORA (75X72X18)', '75X72X18', 347891],
      ['FLORA (75X72X20)', '75X72X20', 362486],
      ['FLORA (75X84X8)', '75X84X8', 183642],
      ['FLORA (75X84X10)', '75X84X10', 229541],
      ['FLORA (75X84X12)', '75X84X12', 273994],
      ['FLORA (75X84X14)', '75X84X14', 319213],
      ['FLORA (75X84X16)', '75X84X16', 347891],
      ['FLORA (75X84X18)', '75X84X18', 413561],
      ['FLORA (75X84X20)', '75X84X20', 450933],
    ],
  },
  {
    line: 'SUPER FLORA',
    tier: 'COMFORT',
    collection: 'better-sleep',
    image: 'super-flora',
    rows: [
      ['SUPER FLORA (75X36X8)', '75X36X8', 80324],
      ['SUPER FLORA (75X42X8)', '75X42X8', 89084],
      ['SUPER FLORA (75X54X8)', '75X54X8', 131055],
      ['SUPER FLORA (75X54X10)', '75X54X10', 165405],
      ['SUPER FLORA (75X54X12)', '75X54X12', 197356],
      ['SUPER FLORA (75X54X14)', '75X54X14', 208235],
      ['SUPER FLORA (75X54X16)', '75X54X16', 238673],
      ['SUPER FLORA (75X54X18)', '75X54X18', 248305],
      ['SUPER FLORA (75X54X20)', '75X54X20', 296660],
      ['SUPER FLORA (75X72X8)', '75X72X8', 160648],
      ['SUPER FLORA (75X72X10)', '75X72X10', 215074],
      ['SUPER FLORA (75X72X12)', '75X72X12', 245194],
      ['SUPER FLORA (75X72X14)', '75X72X14', 255750],
      ['SUPER FLORA (75X72X16)', '75X72X16', 303524],
      ['SUPER FLORA (75X72X18)', '75X72X18', 355046],
      ['SUPER FLORA (75X72X20)', '75X72X20', 369938],
      ['SUPER FLORA (75X84X8)', '75X84X8', 187417],
      ['SUPER FLORA (75X84X10)', '75X84X10', 234257],
      ['SUPER FLORA (75X84X12)', '75X84X12', 279627],
      ['SUPER FLORA (75X84X14)', '75X84X14', 325775],
      ['SUPER FLORA (75X84X16)', '75X84X16', 355046],
      ['SUPER FLORA (75X84X18)', '75X84X18', 422058],
    ],
  },
  {
    line: 'FLORA PREMIER',
    tier: 'COMFORT',
    collection: 'better-sleep',
    image: 'flora-premier',
    rows: [
      ['FLORA PREMIER (75X36X8)', '75X36X8', 83111],
      ['FLORA PREMIER (75X42X8)', '75X42X8', 92176],
      ['FLORA PREMIER (75X54X8)', '75X54X8', 134824],
      ['FLORA PREMIER (75X54X10)', '75X54X10', 168532],
      ['FLORA PREMIER (75X54X12)', '75X54X12', 202234],
      ['FLORA PREMIER (75X54X14)', '75X54X14', 215462],
      ['FLORA PREMIER (75X54X16)', '75X54X16', 246953],
      ['FLORA PREMIER (75X54X18)', '75X54X18', 256917],
      ['FLORA PREMIER (75X54X20)', '75X54X20', 306950],
    ],
  },
  {
    line: 'HOSPITAL MATTRESS',
    tier: 'COMFORT',
    collection: 'hotel-collection',
    image: 'hospital-mattress',
    rows: [
      ['GOLDY (75X36X6)', '75X36X6', 56678],
    ],
  },
  {
    line: 'MONDEO SPRING PLUS',
    tier: 'COMFORT',
    collection: 'orthopedic-collection',
    image: 'mondeo-spring-plus',
    rows: [
      ['MONDEO SPRING PLUS (75X48X10)', '75X48X10', 221492],
      ['MONDEO SPRING PLUS (75X54X10)', '75X54X10', 248092],
      ['MONDEO SPRING PLUS (75X72X10)', '75X72X10', 316381],
      ['MONDEO SPRING PLUS (75X84X10)', '75X84X10', 359664],
    ],
  },

  // ------------------------------------------------------------------ VALUE --
  {
    line: 'COMFY',
    tier: 'VALUE',
    collection: 'budget-sleep',
    image: 'comfy',
    rows: [
      ['COMFY (75X30X4)', '75X30X4', 26586],
      ['COMFY (75X30X6)', '75X30X6', 35687],
      ['COMFY (75X36X4)', '75X36X4', 27442],
      ['COMFY (75X36X6)', '75X36X6', 47230],
      ['COMFY (75X36X8)', '75X36X8', 61526],
      ['COMFY (75X42X6)', '75X42X6', 51812],
      ['COMFY (75X42X8)', '75X42X8', 69057],
      ['COMFY (75X48X6)', '75X48X6', 54781],
      ['COMFY (75X48X8)', '75X48X8', 72929],
      ['COMFY (75X48X10)', '75X48X10', 91078],
      ['COMFY (75X48X12)', '75X48X12', 109288],
      ['COMFY (75X54X6)', '75X54X6', 61511],
      ['COMFY (75X54X8)', '75X54X8', 88617],
      ['COMFY (75X54X10)', '75X54X10', 110793],
      ['COMFY (75X54X12)', '75X54X12', 132834],
      ['COMFY (75X72X8)', '75X72X8', 109270],
      ['COMFY (75X72X10)', '75X72X10', 136463],
      ['COMFY (75X84X8)', '75X84X8', 127356],
    ],
  },
  {
    line: 'MOUKA KIDDIES',
    tier: 'VALUE',
    collection: 'budget-sleep',
    image: 'mouka-kiddies',
    audiences: ['child'],
    rows: [
      ['MOUKA KIDDIES (75X30X4)', '75X30X4', 23058],
      ['MOUKA KIDDIES (75X30X6)', '75X30X6', 34604],
      ['MOUKA KIDDIES (75X36X6)', '75X36X6', 41499],
    ],
  },
  {
    line: 'BABY MATTRESS',
    tier: 'VALUE',
    collection: 'budget-sleep',
    image: 'baby-mattress',
    audiences: ['child'],
    rows: [
      ['BABY MATTRESS B (40X22X6)', '40X22X6', 18896],
      ['BABY MATTRESS B (46X22X6)', '46X22X6', 20470],
      ['BABY MATTRESS G (40X22X6)', '40X22X6', 18896],
      ['BABY MATTRESS G (46X22X6)', '46X22X6', 20470],
    ],
  },
];

/** Flatten the owner's rows into the storefront/API product shape. */
export function buildOwnerProducts(slugify) {
  const slug = slugify || ((text) =>
    String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));

  return ownerLines.flatMap((entry, lineIndex) =>
    entry.rows.map(([label, size, price], rowIndex) => ({
      id: `${slug(entry.line)}-${rowIndex + 1}`,
      slug: `${slug(entry.line)}-${rowIndex + 1}`,
      name: label,
      collection: entry.collection,
      description: `${label} — owner-supplied price list. Size ${size}. Other specifications have not been supplied.`,
      price,
      images: [`/images/beds/${entry.image}.svg`],
      sizes: [size],
      firmness: entry.firmness ? [...entry.firmness] : [],
      audiences: entry.audiences ? [...entry.audiences] : [],
      stockStatus: 'TBD',
      specs: {
        tier: entry.tier,
        productLine: entry.line,
        source: 'Owner price list, 2026-11-24',
      },
      isPlaceholder: false,
      isImageIllustrative: true,
      isBestSeller: false,
      isNewArrival: false,
      dateAdded: null,
    }))
  );
}

export default ownerLines;
