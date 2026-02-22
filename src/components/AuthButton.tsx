import React from 'react';

interface AuthButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
}) => {
  const baseClasses = "rounded-[24px] w-full py-3 px-6  font-semibold text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    secondary: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
  };

  const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
    >
      {children}
    </button>
  );
};
