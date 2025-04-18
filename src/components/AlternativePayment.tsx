import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, walletService } from '../services/api';

interface AlternativePaymentProps {
  totalAmount: number;
  onPaymentComplete: (paymentMethod: string) => void;
  onCancel: () => void;
}

const AlternativePayment: React.FC<AlternativePaymentProps> = ({
  totalAmount,
  onPaymentComplete,
  onCancel
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const navigate = useNavigate();

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
      description: 'Pay using UPI (Google Pay, PhonePe, etc.)',
      icon: '💳'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay using credit or debit card',
      icon: '💳'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'Pay using your bank account',
      icon: '🏦'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      description: `Pay using wallet balance (₹${walletBalance.toFixed(2)} available)`,
      icon: '💰',
      disabled: walletBalance < totalAmount
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive the order',
      icon: '💵'
    }
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    if (paymentMethods.find(m => m.id === methodId)?.disabled) {
      return;
    }
    setSelectedMethod(methodId);
  };

  const handleProceedToPayment = async () => {
    if (!selectedMethod) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      // Validate that the total amount is greater than 0
      if (totalAmount <= 0) {
        setError('Order amount must be greater than 0');
        setIsProcessing(false);
        return;
      }
      
      // If wallet payment was selected, deduct from wallet using the API
      if (selectedMethod === 'wallet') {
        const withdrawResponse = await walletService.withdrawMoney(totalAmount);
        
        if (!withdrawResponse.success) {
          setError(withdrawResponse.message || 'Failed to process wallet payment. Please try again.');
          setIsProcessing(false);
          return;
        }
        
        // Update the wallet balance in localStorage with the new balance from the server
        localStorage.setItem('walletBalance', withdrawResponse.newBalance.toString());
      }
      
      // Call the onPaymentComplete callback with the selected payment method
      onPaymentComplete(selectedMethod);
      
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
        <h2 className="text-2xl font-bold mb-4">Choose Payment Method</h2>
        <p className="text-gray-600 mb-6">Total Amount: ₹{totalAmount.toFixed(2)}</p>
        
        <div className="space-y-4 mb-6">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              } ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handlePaymentMethodSelect(method.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <h3 className="font-semibold">{method.name}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                  {method.disabled && (
                    <p className="text-sm text-red-500 mt-1">Insufficient balance</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleProceedToPayment}
            disabled={!selectedMethod || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Proceed to Pay'}
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

export default AlternativePayment; 