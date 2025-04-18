interface Order {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  timestamp: string;
  items?: OrderItem[];
}

interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

interface OrderResponse {
  success: boolean;
  error?: string;
  data?: Order;
}

class OrderService {
  private orders: Order[] = [];

  async createOrder(amount: number, paymentMethod: string): Promise<Order> {
    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      status: 'completed',
      paymentMethod,
      timestamp: new Date().toISOString()
    };

    this.orders.push(order);
    return order;
  }

  async createDirectOrder(items: OrderItem[]): Promise<OrderResponse> {
    try {
      // Calculate total amount from items
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const order: Order = {
        id: Math.random().toString(36).substr(2, 9),
        amount: totalAmount,
        status: 'completed',
        paymentMethod: 'wallet',
        timestamp: new Date().toISOString(),
        items: items
      };

      this.orders.push(order);
      
      return {
        success: true,
        data: order
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    return this.orders.find(order => order.id === orderId);
  }
}

export const orderService = new OrderService(); 