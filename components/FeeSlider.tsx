'use client';
import { useState, useEffect } from 'react';
import { getPricingForTime } from '@/lib/pricing';

export default function PriceSlider({ onChange, initialValue }: { onChange: (price: number) => void, initialValue: number }) {
  const [price, setPrice] = useState(initialValue);
  const [rules, setRules] = useState<{ min: number, suggested: number, max: number }>({ min: 20, suggested: 25, max: 50 });
  
  useEffect(() => {
    setRules(getPricingForTime(new Date().getHours()));
    const interval = setInterval(() => {
      setRules(getPricingForTime(new Date().getHours()));
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setPrice(val);
    onChange(val);
  };

  return (
    <div className="space-y-3 bg-neutral-800 p-4 rounded-lg border border-neutral-700">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-300">
          Delivery Fee
        </label>
        <span className="text-2xl font-bold text-blue-400">₹{price}</span>
      </div>
      
      <input
        type="range"
        min={rules.min}
        max={rules.max}
        step={5}
        value={price}
        onChange={handleChange}
        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>Min: ₹{rules.min}</span>
        <span className="text-blue-400 font-medium">Suggested: ₹{rules.suggested}</span>
        <span>Max: ₹{rules.max}</span>
      </div>
      
      <p className="text-xs text-gray-400 mt-1">
        Tip: Higher prices get accepted faster xp
      </p>
    </div>
  );
}