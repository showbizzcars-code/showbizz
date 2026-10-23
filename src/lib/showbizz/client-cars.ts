/**
 * Client-supplied vehicle model names for the Showbizz Cars catalogue.
 * These names are confirmed by the client; photos, specifications, prices,
 * rental terms and live availability must come from an authorised listing.
 */
export const CLIENT_CAR_CATALOG = [
  { slug: "bmw-2-series", title: "BMW 2 Series" },
  { slug: "bmw-x3", title: "BMW X3" },
  { slug: "bmw-330li", title: "BMW 330Li" },
  { slug: "bmw-ix7", title: "BMW iX7" },
  { slug: "range-rover-defender", title: "Range Rover Defender" },
  { slug: "range-rover-sport", title: "Range Rover Sport" },
  { slug: "range-rover-velar", title: "Range Rover Velar" },
  { slug: "audi-a6", title: "Audi A6" },
  { slug: "mercedes-benz-gla", title: "Mercedes-Benz GLA" },
  { slug: "jaguar-xf", title: "Jaguar XF" },
  { slug: "hycross-hybrid", title: "Hycross Hybrid" },
] as const;

export type ClientCarModel = (typeof CLIENT_CAR_CATALOG)[number];
