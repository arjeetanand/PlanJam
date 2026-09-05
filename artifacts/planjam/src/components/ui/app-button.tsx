import type { ReactNode } from 'react';

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  testId,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  className?: string;
  disabled?: boolean;
  testId: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const styles = {
    primary: 'bg-[#F26F52] text-[#FFF7E8] shadow-[0_4px_0_#C54E3A] hover:-translate-y-0.5 hover:bg-[#e96248] active:translate-y-0 active:shadow-[0_2px_0_#C54E3A]',
    secondary: 'bg-[#FFF7E8] text-[#27304C] border border-[#D6D6DF] shadow-[0_3px_0_#D6D6DF] hover:-translate-y-0.5 hover:border-[#27304C] active:translate-y-0',
    ghost: 'text-[#5E6377] hover:bg-[#EDE9DB] hover:text-[#27304C]',
    dark: 'bg-[#27304C] text-[#FFF7E8] shadow-[0_4px_0_#11182D] hover:-translate-y-0.5 hover:bg-[#343e5e] active:translate-y-0 active:shadow-[0_2px_0_#11182D]',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-[transform,background-color,border-color,box-shadow] duration-200 focus-visible:outline-[3px] focus-visible:outline-[#F26F52] focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}