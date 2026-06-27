// src/lib/image-engine/cost.ts
// Cost tracking for the image engine pipeline.
// Pexels, Unsplash, and backend renderer are all $0.
// Only creative-director Claude call has a token cost (tracked by existing system).

export interface CostEstimate {
  pexelsCost: number
  unsplashCost: number
  rendererCost: number
  paidImageApiUsed: boolean
  estimatedTotalCostUsd: number
}

export function buildCostEstimate(): CostEstimate {
  return {
    pexelsCost: 0,
    unsplashCost: 0,
    rendererCost: 0,
    paidImageApiUsed: false,
    estimatedTotalCostUsd: 0,
  }
}
