'use client';
import React, { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ 
  length = 6, 
  onComplete 
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all fields are filled
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = '';
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
      setOtp(newOtp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (pastedDigits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedDigits.length && i < length; i++) {
        newOtp[i] = pastedDigits[i];
      }
      setOtp(newOtp);
      
      const nextIndex = Math.min(pastedDigits.length, length - 1);
      setActiveIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
      
      if (newOtp.every(digit => digit !== '')) {
        onComplete(newOtp.join(''));
      }
    }
  };

  useEffect(() => {
    if (inputRefs.current[activeIndex]) {
      inputRefs.current[activeIndex]?.focus();
    }
  }, [activeIndex]);

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={() => setActiveIndex(index)}
          className="w-12 h-12 text-center text-black text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
        />
      ))}
    </div>
  );
};
