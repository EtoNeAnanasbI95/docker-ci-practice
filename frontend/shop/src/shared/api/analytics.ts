import type { BrandSalesAnalytics } from "@/shared/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function fetchBrandAnalytics(): Promise<BrandSalesAnalytics[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/Analytics/brands`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`brand analytics status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch brand analytics", error);
    return [];
  }
}
