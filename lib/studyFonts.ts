import { Caveat, Courier_Prime, EB_Garamond } from "next/font/google";

// The study's three voices: Garamond for the room and titles, a typewriter for
// catalog-card data (cards were typed — this is the literal medium, not a
// costume), and a pencil hand for marginalia.
export const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

export const typewriter = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-typewriter",
  display: "swap",
});

export const pencil = Caveat({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-pencil",
  display: "swap",
});

export const studyFontVars = `${garamond.variable} ${typewriter.variable} ${pencil.variable}`;
