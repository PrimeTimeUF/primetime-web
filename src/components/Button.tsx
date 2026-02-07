import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button visual variant
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "ghost";

  /**
   * Button size
   * @default "default"
   */
  size?: "sm" | "default" | "lg";

  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Icon to display before the button text
   */
  iconBefore?: React.ReactNode;

  /**
   * Icon to display after the button text
   */
  iconAfter?: React.ReactNode;

  /**
   * Loading state - disables button and shows loading indicator
   * @default false
   */
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "default",
      fullWidth = false,
      iconBefore,
      iconAfter,
      isLoading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles matching the design system
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium leading-none whitespace-nowrap
      rounded-lg
      transition-all duration-200 ease-in-out
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black
      disabled:cursor-not-allowed disabled:opacity-50
    `.trim().replace(/\s+/g, " ");

    // Variant styles
    const variantStyles = {
      primary: `
        bg-black text-white
        hover:bg-gray-800
      `,
      secondary: `
        bg-gray-100 text-black border border-gray-200
        hover:bg-gray-200 hover:border-gray-300
      `,
      ghost: `
        bg-transparent text-black
        hover:bg-gray-100
      `,
    };

    // Size styles
    const sizeStyles = {
      sm: "px-4 py-2 text-xs",
      default: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base rounded-xl",
    };

    // Width styles
    const widthStyles = fullWidth ? "w-full" : "";

    // Combine all styles
    const buttonStyles = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${widthStyles}
      ${className}
    `.trim().replace(/\s+/g, " ");

    return (
      <button
        ref={ref}
        className={buttonStyles}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {iconBefore && <span className="flex-shrink-0">{iconBefore}</span>}
            {children}
            {iconAfter && <span className="flex-shrink-0">{iconAfter}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
