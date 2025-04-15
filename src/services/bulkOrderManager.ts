import { Product, PricingTier } from '../types/index';

// Product with tiered pricing
export class ProductWithTiers {
  id: string;
  name: string;
  regularPrice: number;
  moqTiers: Record<number, number>; // quantity threshold -> discounted price

  constructor(id: string, name: string, regularPrice: number, moqTiers: Record<number, number>) {
    this.id = id;
    this.name = name;
    this.regularPrice = regularPrice;
    // Sort tiers by quantity
    this.moqTiers = Object.fromEntries(
      Object.entries(moqTiers).sort(([a], [b]) => Number(a) - Number(b))
    );
  }

  getPriceForQuantity(quantity: number): number {
    if (quantity === 0) {
      return this.regularPrice;
    }

    // Find the highest tier that the quantity satisfies
    let applicablePrice = this.regularPrice;
    for (const [tierQuantity, tierPrice] of Object.entries(this.moqTiers)) {
      if (quantity >= Number(tierQuantity)) {
        applicablePrice = Number(tierPrice);
      } else {
        break;
      }
    }

    return applicablePrice;
  }
}

// Order from a user
export class Order {
  orderId: string;
  userId: string;
  productId: string;
  quantity: number;
  batchId: string | null;
  finalPrice: number | null;
  contributionPercentage: number | null; // Percentage of total order this user contributed
  additionalDiscount: number | null; // Additional discount based on contribution

  constructor(orderId: string, userId: string, productId: string, quantity: number) {
    this.orderId = orderId;
    this.userId = userId;
    this.productId = productId;
    this.quantity = quantity;
    this.batchId = null;
    this.finalPrice = null;
    this.contributionPercentage = null;
    this.additionalDiscount = null;
  }
}

// Batch of orders for a product
export class Batch {
  batchId: string;
  productId: string;
  creationTime: Date;
  orders: Order[];
  isFinalized: boolean;
  finalPricePerUnit: number | null;
  maxContributionPercentage: number; // Maximum contribution percentage for additional discount

  constructor(batchId: string, productId: string, creationTime: Date) {
    this.batchId = batchId;
    this.productId = productId;
    this.creationTime = creationTime;
    this.orders = [];
    this.isFinalized = false;
    this.finalPricePerUnit = null;
    this.maxContributionPercentage = 0;
  }

  addOrder(order: Order): void {
    if (this.isFinalized) {
      throw new Error("Cannot add orders to a finalized batch");
    }

    order.batchId = this.batchId;
    this.orders.push(order);
  }

  getTotalQuantity(): number {
    return this.orders.reduce((total, order) => total + order.quantity, 0);
  }

  finalize(product: ProductWithTiers): boolean {
    if (this.isFinalized) {
      return false;
    }

    const totalQuantity = this.getTotalQuantity();
    this.finalPricePerUnit = product.getPriceForQuantity(totalQuantity);

    // Calculate contribution percentages
    if (totalQuantity > 0) {
      // Sort orders by quantity (descending)
      this.orders.sort((a, b) => b.quantity - a.quantity);
      
      // Calculate contribution percentages
      this.orders.forEach(order => {
        order.contributionPercentage = (order.quantity / totalQuantity) * 100;
      });
      
      // Set max contribution percentage
      if (this.orders.length > 0 && this.orders[0].contributionPercentage !== null) {
        this.maxContributionPercentage = this.orders[0].contributionPercentage;
      }
      
      // Set final price without additional discounts
      this.orders.forEach(order => {
        if (this.finalPricePerUnit !== null) {
          order.finalPrice = this.finalPricePerUnit * order.quantity;
        } else {
          order.finalPrice = 0;
        }
      });
    } else {
      // If no orders, set final price to 0
      this.orders.forEach(order => {
        order.finalPrice = 0;
        order.contributionPercentage = 0;
        order.additionalDiscount = 0;
      });
    }

    this.isFinalized = true;

    // Return whether we got a discount
    return this.finalPricePerUnit < product.regularPrice;
  }
}

// Manager for bulk orders
export class BulkOrderManager {
  products: Record<string, ProductWithTiers> = {};
  activeBatches: Record<string, Batch> = {};
  finalizedBatches: Batch[] = [];
  orders: Record<string, Order> = {};
  nextBatchId: number = 1;
  nextOrderId: number = 1;
  existingOrders: Record<string, number> = {}; // Track existing orders by productId

  constructor() {
    this.reset();
  }

  reset(): void {
    this.products = {};
    this.activeBatches = {};
    this.finalizedBatches = [];
    this.orders = {};
    this.nextBatchId = 1;
    this.nextOrderId = 1;
    this.existingOrders = {};
  }

  addProduct(product: Product): void {
    // Convert Product to ProductWithTiers
    const moqTiers: Record<number, number> = {};
    
    // Create tiers based on minOrderQuantity and bulkPrice
    if (product.minOrderQuantity > 0) {
      moqTiers[product.minOrderQuantity] = product.bulkPrice;
      
      // Add additional tiers with increasing discounts
      if (product.minOrderQuantity * 2 > 0) {
        moqTiers[product.minOrderQuantity * 2] = product.bulkPrice * 0.9;
      }
      
      if (product.minOrderQuantity * 3 > 0) {
        moqTiers[product.minOrderQuantity * 3] = product.bulkPrice * 0.8;
      }
    }
    
    this.products[product._id] = new ProductWithTiers(
      product._id,
      product.name,
      product.regularPrice,
      moqTiers
    );
  }

  // Initialize with existing orders from the community
  initializeExistingOrders(productId: string, totalQuantity: number): void {
    if (!this.products[productId]) {
      throw new Error(`Product ${productId} does not exist`);
    }

    // Store the existing quantity
    this.existingOrders[productId] = totalQuantity;
    
    // Create a new batch for existing orders if one doesn't exist
    if (!this.activeBatches[productId]) {
      const batch = new Batch(`batch-${this.nextBatchId}`, productId, new Date());
      this.nextBatchId += 1;
      this.activeBatches[productId] = batch;
    }
  }

  // Create or update an order for a user
  createOrder(userId: string, productId: string, quantity: number): {
    orderId: string;
    totalQuantity: number;
    nextThreshold: number | null;
  } {
    if (!this.products[productId]) {
      throw new Error(`Product ${productId} does not exist`);
    }

    // Remove any existing order from this user for this product
    this.removeOrder(userId, productId);

    // If quantity is 0, we're done
    if (quantity === 0) {
      return {
        orderId: '',
        totalQuantity: this.getTotalQuantity(productId),
        nextThreshold: this.getNextThreshold(productId)
      };
    }

    // Create the order
    const orderId = `order-${this.nextOrderId}`;
    this.nextOrderId += 1;
    const order = new Order(orderId, userId, productId, quantity);
    this.orders[orderId] = order;

    // Get or create a batch for this product
    if (!this.activeBatches[productId]) {
      const batch = new Batch(`batch-${this.nextBatchId}`, productId, new Date());
      this.nextBatchId += 1;
      this.activeBatches[productId] = batch;
    }

    const batch = this.activeBatches[productId];
    batch.addOrder(order);

    // Calculate total quantity and next threshold
    const totalQuantity = this.getTotalQuantity(productId);
    const nextThreshold = this.getNextThreshold(productId);

    return {
      orderId,
      totalQuantity,
      nextThreshold
    };
  }

  // Get the total quantity for a product (including existing orders)
  getTotalQuantity(productId: string): number {
    const batch = this.activeBatches[productId];
    const batchQuantity = batch ? batch.getTotalQuantity() : 0;
    const existingQuantity = this.existingOrders[productId] || 0;
    
    return batchQuantity + existingQuantity;
  }

  // Get the next threshold for a product
  getNextThreshold(productId: string): number | null {
    if (!this.products[productId]) {
      return null;
    }

    const product = this.products[productId];
    const totalQuantity = this.getTotalQuantity(productId);

    // Find the next MOQ threshold
    for (const tierQuantity of Object.keys(product.moqTiers).map(Number)) {
      if (tierQuantity > totalQuantity) {
        return tierQuantity;
      }
    }

    return null;
  }

  // Remove an order for a user
  removeOrder(userId: string, productId: string): void {
    if (!this.activeBatches[productId]) {
      return;
    }

    const batch = this.activeBatches[productId];
    
    // Find and remove the order for this user
    const orderIndex = batch.orders.findIndex(order => order.userId === userId);
    if (orderIndex !== -1) {
      const order = batch.orders[orderIndex];
      batch.orders.splice(orderIndex, 1);
      delete this.orders[order.orderId];
    }
  }

  // Get the batch status for a product
  getBatchStatus(productId: string): {
    productId: string;
    batchId: string;
    totalQuantity: number;
    currentPrice: number;
    regularPrice: number;
    discountPercentage: number;
    currentTier: number | null;
    nextTier: number | null;
    nextTierPrice: number | null;
    remainingForNextTier: number;
    orderCount: number;
    topContributor: {
      userId: string;
      quantity: number;
      percentage: number;
      additionalDiscount: number;
    } | null;
  } | null {
    if (!this.products[productId]) {
      return null;
    }

    const product = this.products[productId];
    const batch = this.activeBatches[productId];
    
    if (!batch) {
      // If no batch exists, return status based on existing orders only
      const totalQuantity = this.existingOrders[productId] || 0;
      const currentPrice = product.getPriceForQuantity(totalQuantity);
      const regularPrice = product.regularPrice;
      const discountPercentage = ((regularPrice - currentPrice) / regularPrice) * 100;
      
      // Find current tier
      let currentTier: number | null = null;
      let nextTier: number | null = null;
      let nextTierPrice: number | null = null;

      for (const [tierQuantity, tierPrice] of Object.entries(product.moqTiers)) {
        if (totalQuantity >= Number(tierQuantity)) {
          currentTier = Number(tierQuantity);
        } else {
          nextTier = Number(tierQuantity);
          nextTierPrice = Number(tierPrice);
          break;
        }
      }

      const remainingForNextTier = nextTier ? nextTier - totalQuantity : 0;

      return {
        productId,
        batchId: 'no-batch',
        totalQuantity,
        currentPrice,
        regularPrice,
        discountPercentage,
        currentTier,
        nextTier,
        nextTierPrice,
        remainingForNextTier,
        orderCount: 0,
        topContributor: null
      };
    }

    const totalQuantity = this.getTotalQuantity(productId);
    const currentPrice = product.getPriceForQuantity(totalQuantity);
    const regularPrice = product.regularPrice;
    const discountPercentage = ((regularPrice - currentPrice) / regularPrice) * 100;

    // Find current tier
    let currentTier: number | null = null;
    let nextTier: number | null = null;
    let nextTierPrice: number | null = null;

    for (const [tierQuantity, tierPrice] of Object.entries(product.moqTiers)) {
      if (totalQuantity >= Number(tierQuantity)) {
        currentTier = Number(tierQuantity);
      } else {
        nextTier = Number(tierQuantity);
        nextTierPrice = Number(tierPrice);
        break;
      }
    }

    const remainingForNextTier = nextTier ? nextTier - totalQuantity : 0;
    
    // Find top contributor
    let topContributor = null;
    if (batch.orders.length > 0) {
      // Sort orders by quantity (descending)
      const sortedOrders = [...batch.orders].sort((a, b) => b.quantity - a.quantity);
      const topOrder = sortedOrders[0];
      
      if (topOrder) {
        const percentage = (topOrder.quantity / totalQuantity) * 100;
        // Calculate additional discount based on contribution percentage
        const maxAdditionalDiscount = 0.10;
        const additionalDiscount = maxAdditionalDiscount;
        
        topContributor = {
          userId: topOrder.userId,
          quantity: topOrder.quantity,
          percentage: percentage,
          additionalDiscount: additionalDiscount
        };
      }
    }

    return {
      productId,
      batchId: batch.batchId,
      totalQuantity,
      currentPrice,
      regularPrice,
      discountPercentage,
      currentTier,
      nextTier,
      nextTierPrice,
      remainingForNextTier,
      orderCount: batch.orders.length,
      topContributor
    };
  }

  finalizeBatch(productId: string): boolean {
    if (!this.activeBatches[productId]) {
      return false;
    }

    const batch = this.activeBatches[productId];
    const product = this.products[productId];

    // Finalize the current batch
    const gotDiscount = batch.finalize(product);

    // Move it to finalized batches
    this.finalizedBatches.push(batch);

    // Create a new batch
    const newBatch = new Batch(`batch-${this.nextBatchId}`, productId, new Date());
    this.nextBatchId += 1;
    this.activeBatches[productId] = newBatch;

    return gotDiscount;
  }
}

// Create a singleton instance
const bulkOrderManager = new BulkOrderManager();
export default bulkOrderManager; 