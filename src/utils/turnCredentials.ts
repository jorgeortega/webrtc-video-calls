import type { IceServer } from "../types";

// Configure these with your Metered domain and API key
export const METERED_DOMAIN = import.meta.env.METERED_DOMAIN;
export const METERED_API_KEY = import.meta.env.METERED_API_KEY;

export async function fetchTurnCredentials(
  domain = METERED_DOMAIN,
  apiKey = METERED_API_KEY,
): Promise<IceServer[]> {
  if (!domain || !apiKey) {
    console.warn("Metered credentials not configured, using STUN only");
    return [{ urls: "stun:stun.metered.ca:80" }];
  }

  try {
    const response = await fetch(
      `https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch TURN credentials");
    }

    const iceServers = await response.json();
    return iceServers;
  } catch (error) {
    console.error("Error fetching TURN credentials:", error);
    // Fallback to STUN only
    return [{ urls: "stun:stun.metered.ca:80" }];
  }
}
