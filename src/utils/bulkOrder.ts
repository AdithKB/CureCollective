import { Product, PricingTier, PricingTierData, Order } from '../types/index';

interface BulkOrderProduct extends Product {
  orders: Array<{
    quantity: number;
    price: number;
    pricingTier?: PricingTier;
  }>;
  pricingTiers: PricingTierData[];
  finalized: boolean;
}

export const calculatePrice = (pricingTiers: PricingTierData[], quantity: number): number | null => {
  if (!pricingTiers || pricingTiers.length === 0) return null;
  
  // Sort tiers by minQuantity in ascending order
  const sortedTiers = [...pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);
  
  // Find the applicable tier
  const applicableTier = sortedTiers.find(tier => quantity >= tier.minQuantity);
  
  return applicableTier ? applicableTier.pricePerUnit : null;
};

export const processOrder = (product: BulkOrderProduct) => {
  if (!product.orders || product.orders.length === 0) {
    return {
      currentPrice: null,
      nextTier: null,
      quantityToNextTier: 0
    };
  }
  
  // Calculate total quantity
  const totalQuantity = product.orders.reduce((sum, order) => sum + order.quantity, 0);
  
  // Calculate current and next tier prices
  const currentPrice = calculatePrice(product.pricingTiers, totalQuantity);
  
  // Find next tier
  const sortedTiers = [...product.pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);
  const currentTierIndex = sortedTiers.findIndex(tier => tier.minQuantity > totalQuantity);
  const nextTier = currentTierIndex !== -1 ? sortedTiers[currentTierIndex] : null;
  
  // Calculate quantity needed for next tier
  const quantityToNextTier = nextTier ? nextTier.minQuantity - totalQuantity : 0;
  
  return {
    currentPrice,
    nextTier,
    quantityToNextTier
  };
};

export const getMonthlyCutoff = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export const getCurrentTier = (
  pricingTiers: PricingTierData[],
  currentQuantity: number
): PricingTierData | null => {
  const sortedTiers = [...pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);
  
  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    if (currentQuantity >= sortedTiers[i].minQuantity) {
      return sortedTiers[i];
    }
  }
  
  return null;
};

export const getNextTier = (
  pricingTiers: PricingTierData[],
  currentQuantity: number
): PricingTierData | null => {
  const sortedTiers = [...pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);
  
  for (const tier of sortedTiers) {
    if (currentQuantity < tier.minQuantity) {
      return tier;
    }
  }
  
  return null;
}; 