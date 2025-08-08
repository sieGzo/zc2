const BASE = "https://api.geoapify.com";

export function withKey(url: string) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error("Missing GEOAPIFY_API_KEY");
  const u = new URL(url);
  u.searchParams.set("apiKey", apiKey);
  return u.toString();
}
