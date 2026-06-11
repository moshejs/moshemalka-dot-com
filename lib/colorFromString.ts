// Deterministic, pleasant color from a string. Used as a default spine color
// when we don't have one extracted from the cover image.
const PALETTE = [
  "#5b3a29", // deep walnut
  "#7a4b2a", // burnished oak
  "#3e2c1c", // bitter chocolate
  "#8a3324", // burgundy
  "#4a5d23", // moss
  "#2c4257", // ink blue
  "#5a4e3c", // tobacco
  "#6b2737", // claret
  "#264e36", // pine
  "#7d6b4a", // muted brass
  "#4b3f2f", // cocoa
  "#2f3a4a", // slate blue
];

export function colorFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}
