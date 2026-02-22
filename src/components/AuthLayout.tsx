'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const loadingImages = [
  '/loading/1.png',
  '/loading/2.png',
  '/loading/3.png',
  '/loading/4.png',
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % loadingImages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-red-500 to-purple-600 flex items-center justify-center">
      <div className="bg-gradient-to-b from-red-500 to-purple-600 overflow-hidden w-full h-full flex" >
          {/* Left Panel - Gradient Background */}
          <div className="flex-1 bg-gradient-to-b from-red-500 to-purple-600 relative p-2 flex flex-col justify-between h-full">
            {/* Logo */}
            <div className="flex items-center ">
             <Image
                 src={'/logo.png'}
                 height={140}
                 width={140}
                 alt="Logo"
             />
            </div>

            {/* Illustration and Content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="relative w-[437px] h-[437px] flex items-center justify-center">
                <Image
                  src={loadingImages[currentImageIndex]}
                  alt="Loading illustration"
                  width={370}
                  height={300}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <h1 className="text-white text-2xl font-bold mt-1 mb-2">
                {title}
              </h1>
              <p className="text-white/90 text-lg">
                {subtitle}
              </p>
            </div>

            {/* Carousel Indicator */}
            <div className="flex justify-center space-x-2 pb-8">
              {loadingImages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="flex-1 p-8 rounded-2xl border-l-1 bg-white">
            {children}
          </div>
        </div>
    </div>
  );
};
