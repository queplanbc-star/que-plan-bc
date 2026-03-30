import React, { useState, useEffect } from 'react';
import { X, CreditCard, Heart, Loader2, CheckCircle2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// Load Stripe (replace with your actual public key)
const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREDEFINED_AMOUNTS = [50, 100, 200];

const StripeCheckoutForm = ({ amount, onSuccess }: { amount: number, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create PaymentIntent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }

      const { clientSecret } = await response.json();

      // 2. Confirm the payment on the client
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement as any,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          'Confirmar Donación Segura'
        )}
      </button>
    </form>
  );
};

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    } else {
      setAmount(0);
    }
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
      setIsSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="overflow-y-auto p-6 md:p-8">
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por tu apoyo!</h2>
              <p className="text-gray-600">Tu donación nos ayuda a seguir creciendo.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Apoya a Qué Plan</h2>
                <p className="text-gray-600 text-sm">
                  Somos un proyecto local e independiente. Tu contribución nos ayuda a mantener la agenda cultural actualizada, pagar los servidores y seguir mejorando la plataforma.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Elige un monto (MXN)</label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {PREDEFINED_AMOUNTS.map(preset => (
                    <button
                      key={preset}
                      onClick={() => handleAmountSelect(preset)}
                      className={`py-2 rounded-xl border-2 font-medium transition-colors ${
                        !isCustom && amount === preset 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setIsCustom(true)}
                    className={`w-full py-2 rounded-xl border-2 font-medium transition-colors text-left px-4 ${
                      isCustom 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    {isCustom ? '' : 'Otro monto'}
                  </button>
                  {isCustom && (
                    <div className="absolute inset-0 flex items-center px-4">
                      <span className="text-gray-500 mr-1">$</span>
                      <input
                        type="number"
                        autoFocus
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        placeholder="0"
                        className="bg-transparent border-none outline-none w-full font-medium text-indigo-700"
                        min="10"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                      paymentMethod === 'stripe' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setPaymentMethod('stripe')}
                  >
                    <CreditCard className="w-4 h-4 inline-block mr-2" />
                    Tarjeta
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                      paymentMethod === 'paypal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    PayPal
                  </button>
                </div>

                {amount > 0 ? (
                  paymentMethod === 'stripe' ? (
                    <Elements stripe={stripePromise}>
                      <StripeCheckoutForm amount={amount} onSuccess={handleSuccess} />
                    </Elements>
                  ) : (
                    <PayPalScriptProvider options={{ 
                      "clientId": (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || "test",
                      currency: "MXN",
                      intent: "capture"
                    }}>
                      <PayPalButtons 
                        style={{ layout: "vertical", shape: "rect" }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [
                              {
                                amount: {
                                  currency_code: "MXN",
                                  value: amount.toString(),
                                },
                              },
                            ],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          if (actions.order) {
                            await actions.order.capture();
                            handleSuccess();
                          }
                        }}
                      />
                    </PayPalScriptProvider>
                  )
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Por favor, ingresa un monto válido para continuar.
                  </div>
                )}
              </div>

              <div className="text-center mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Tus datos de pago están encriptados y protegidos por Stripe y PayPal. Qué Plan nunca almacena la información de tu tarjeta.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
