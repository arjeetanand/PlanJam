import type { ReactNode } from 'react';

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  testId,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark' | 'success';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  testId: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const styles = {
    primary: 'bg-[#F26F52] text-[#FFF7E8] border-2 border-[#27304C] shadow-[3px_3px_0_#27304C] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#27304C] active:translate-y-0.5 active:shadow-[1px_1px_0_#27304C]',
    secondary: 'bg-[#FFF7E8] text-[#27304C] border-2 border-[#27304C] shadow-[3px_3px_0_#27304C] hover:-translate-y-0.5 hover:bg-[#FFFDF5] active:translate-y-0.5 active:shadow-[1px_1px_0_#27304C]',
    ghost: 'text-[#5E6377] hover:bg-[#EDE9DB]/70 hover:text-[#27304C] active:bg-[#E2DDD0]',
    dark: 'bg-[#27304C] text-[#FFF7E8] border-2 border-[#11182D] shadow-[3px_3px_0_#F26F52] hover:-translate-y-0.5 hover:bg-[#323D60] active:translate-y-0.5 active:shadow-[1px_1px_0_#F26F52]',
    success: 'bg-[#37A28C] text-[#FFF7E8] border-2 border-[#27304C] shadow-[3px_3px_0_#27304C] hover:-translate-y-0.5 hover:bg-[#2F8B78] active:translate-y-0.5 active:shadow-[1px_1px_0_#27304C]',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold tracking-tight transition-all duration-150 focus-visible:outline-[3px] focus-visible:outline-[#F26F52] focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${styles[variant]} ${className}`}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}