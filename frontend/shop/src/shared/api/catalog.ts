import { ProductInventoryItem } from "@/shared/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function fetchCatalog(): Promise<ProductInventoryItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/Product/catalog`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`catalog status ${response.status}`);
    }
    return response.json();
  } catch {
    return [];
  }
}
