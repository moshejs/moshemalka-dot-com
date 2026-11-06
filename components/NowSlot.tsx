import { createContext, useContext } from "react";

/* Space held for a live band while its data loads.

   The bands under the hero are client-only and arrive a few hundred ms after
   first paint. Without a reservation they push the Work section down (CLS
   0.068 on Lighthouse desktop). The page server-renders one empty slot per
   band that will show, sized in theme.css to the band's measured height, and
   each band keeps rendering the slot until its data is in. Which bands will
   show is decided at build time from the configured providers, so a site with
   nothing connected reserves nothing. */

export type LiveProviders = { spotify: boolean; oura: boolean };
export type NowBand = "live" | "trends" | "patterns";

export const LiveProvidersContext = createContext<LiveProviders>({ spotify: false, oura: false });

export function NowSlot({ band }: { band: NowBand }) {
  const { spotify, oura } = useContext(LiveProvidersContext);
  const expected = band === "live" ? spotify || oura : oura;
  return expected ? <div className={`c-now-slot c-now-slot--${band}`} aria-hidden="true" /> : null;
}
