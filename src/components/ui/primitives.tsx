import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ButtonVariant =
  | 'gold'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'default' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  gold:
    'bg-[#F59E0B] text-black border border-[#FBBF24] hover:bg-[#FBBF24] active:bg-[#D97706] shadow-[0_2px_10px_rgba(245,158,11,0.22)]',
  secondary:
    'bg-[#1A1726] text-[#F5F3FF] border border-white/15 hover:bg-[#231F33] hover:border-white/25 active:bg-[#14111E]',
  outline:
    'bg-[#0D0B14] text-[#F5F3FF] border border-white/15 hover:border-[#F59E0B]/60 hover:bg-[#161322] active:bg-[#12101B]',
  ghost:
    'bg-transparent text-[#B6B0CC] border border-transparent hover:text-[#F5F3FF] hover:bg-white/5 active:bg-white/10',
  danger:
    'bg-[#E11D48] text-white border border-rose-400/50 hover:bg-rose-500 active:bg-rose-700',
  success:
    'bg-[#10B981] text-black border border-emerald-300/60 hover:bg-emerald-400 active:bg-emerald-600',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'min-h-[48px] px-4 py-2.5 rounded-xl type-caption font-bold tracking-wide',
  lg: 'min-h-[56px] px-5 py-3 rounded-xl type-title tracking-wider',
  icon: 'min-h-[48px] min-w-[48px] p-2.5 rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'secondary',
      size = 'default',
      active = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const activeRing = active
      ? 'border-[#F59E0B] bg-[#F59E0B] text-black shadow-[0_0_16px_rgba(245,158,11,0.3)]'
      : VARIANT_CLASSES[variant];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`motion-interactive inline-flex items-center justify-center gap-2 select-none cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09080D] disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${activeRing} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'gold' | 'success' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  className = '',
  children,
  ...props
}) => {
  const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    neutral: 'bg-[#0D0B14] border-white/15 text-[#B6B0CC]',
    gold: 'bg-[#F59E0B]/15 border-[#F59E0B]/60 text-[#FBBF24]',
    success: 'bg-[#10B981]/15 border-[#10B981]/60 text-[#10B981]',
    danger: 'bg-[#E11D48]/15 border-[#E11D48]/60 text-rose-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border type-caption ${toneClasses[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`motion-interactive w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#0D0B14] border border-white/15 type-body text-[#F5F3FF] placeholder:text-[#B6B0CC]/60 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/30 disabled:opacity-40 ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    className={`motion-interactive w-full min-h-[56px] px-3.5 py-2.5 rounded-xl bg-[#0D0B14] border border-white/15 type-body text-[#F5F3FF] placeholder:text-[#B6B0CC]/60 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/30 disabled:opacity-40 resize-y ${className}`}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
  'data-testid'?: string;
}

export const SwitchRow: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  id,
  'data-testid': testId,
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      onClick={() => onCheckedChange(!checked)}
      className="motion-interactive w-full min-h-[56px] p-3 rounded-xl bg-[#0D0B14] hover:bg-[#151220] border border-white/10 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
    >
      <div className="min-w-0 space-y-0.5">
        <div className="type-body text-[#F5F3FF] font-semibold">{label}</div>
        {description && (
          <div className="type-caption text-[#B6B0CC] font-normal">{description}</div>
        )}
      </div>
      <span
        aria-hidden="true"
        className={`w-12 h-7 rounded-full p-1 flex items-center shrink-0 border ${
          checked
            ? 'bg-[#F59E0B] border-[#FBBF24] justify-end'
            : 'bg-[#1A1726] border-white/15 justify-start'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full ${
            checked ? 'bg-black' : 'bg-[#B6B0CC]'
          }`}
        />
      </span>
    </button>
  );
};

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  'data-testid': testId,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid={testId}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
    >
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full sm:max-w-xl max-h-[88dvh] surface-sheet rounded-b-none sm:rounded-3xl flex flex-col overflow-hidden">
        {/* Top Sheet Handle & Header */}
        <div className="pt-2.5 px-4 pb-3 border-b border-white/10 bg-[#191625]">
          <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="type-title text-[#F5F3FF]">{title}</h2>
              {subtitle && (
                <p className="type-caption text-[#B6B0CC] font-normal leading-snug">
                  {subtitle}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Close ${title}`}
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="p-4 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
};

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  'data-testid': testId,
}) => {
  if (!open) return null;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={subtitle}
      data-testid={testId}
    >
      {children}
    </Sheet>
  );
};
