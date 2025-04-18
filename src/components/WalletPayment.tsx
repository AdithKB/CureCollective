import React, { useState, useEffect } from 'react';
import { walletService } from '../services/api';

interface WalletPaymentProps {
  amount: number;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

const WalletPayment: React.FC<WalletPaymentProps> = ({
  amount,
  onPaymentComplete,
  onCancel
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Fetch wallet balance from server when component mounts
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const response = await walletService.getBalance();
        if (response && response.balance !== undefined) {
          setWalletBalance(response.balance);
          localStorage.setItem('walletBalance', response.balance.toString());
        } else {
          console.error('Invalid response format from wallet balance API:', response);
        }
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
      }
    };

    fetchWalletBalance();
  }, []);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      description: 'Add money using UPI (Google Pay, PhonePe, etc.)',
      icon: '💳'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Add money using credit or debit card',
      icon: '💳'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'Add money using your bank account',
      icon: '🏦'
    }
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      // Validate that the amount is greater than 0
      if (amount <= 0) {
        setError('Amount must be greater than 0');
        setIsProcessing(false);
        return;
      }
      
      // Here you would integrate with a payment gateway
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use walletService to add money to the wallet in the database
      const response = await walletService.addMoney(amount);
      
      if (response.success) {
        // Update the wallet balance in localStorage with the new balance from the server
        localStorage.setItem('walletBalance', response.data.newBalance.toString());
        
        // Call the onPaymentComplete callback
        onPaymentComplete();
      } else {
        setError(response.error || 'Failed to add money to wallet');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setError('An error occurred while processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Add Money to Wallet</h2>
        <p className="text-gray-600 mb-6">Amount: ₹{amount.toFixed(2)}</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <h3 className="font-semibold">{method.name}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Add Money'}
          </button>
          <button
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletPayment; 