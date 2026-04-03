"use client";

import { createContext, forwardRef, useContext } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CornerAccents, themeTokens } from "@/components/ui/dashboard-primitives";

/* ------------------------------------------------------------------ */
/*  Internal theme context                                             */
/* ------------------------------------------------------------------ */

const ModalThemeContext = createContext<boolean>(true);

/* ------------------------------------------------------------------ */
/*  Modal (root)                                                       */
/* ------------------------------------------------------------------ */

interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Modal({ open, onOpenChange, children }: Readonly<ModalProps>) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal.Trigger                                                      */
/* ------------------------------------------------------------------ */

const ModalTrigger = forwardRef<
  HTMLButtonElement,
  Dialog.DialogTriggerProps
>(({ children, className = "", ...props }, ref) => (
  <Dialog.Trigger ref={ref} className={className} asChild {...props}>
    {children}
  </Dialog.Trigger>
));
ModalTrigger.displayName = "Modal.Trigger";

/* ------------------------------------------------------------------ */
/*  Modal.Content                                                      */
/* ------------------------------------------------------------------ */

interface ModalContentProps extends Dialog.DialogContentProps {
  /** Width preset. Defaults to "md". */
  size?: "sm" | "md" | "lg";
  /** Match the dashboard theme. Defaults to true (dark). */
  isDark?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className = "", size = "md", isDark = true, ...props }, ref) => {
    const t = themeTokens(isDark);
    return (
      <ModalThemeContext.Provider value={isDark}>
        <Dialog.Portal>
          {/* Overlay */}
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          {/* Panel */}
          <Dialog.Content
            ref={ref}
            className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 border ${t.border} ${isDark ? "bg-black" : "bg-white"} p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${sizeStyles[size]} ${className}`}
            {...props}
          >
            <CornerAccents isDark={isDark} />

            <div className="relative z-10">
              {children}
            </div>

            {/* Close button */}
            <Dialog.Close
              aria-label="Close"
              className={`absolute right-4 top-4 border ${t.border} p-1 ${t.textMid} transition-colors duration-200 ${isDark ? "hover:border-white/40 hover:text-white" : "hover:border-black/40 hover:text-black"} focus-visible:outline-none`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </ModalThemeContext.Provider>
    );
  }
);
ModalContent.displayName = "Modal.Content";

/* ------------------------------------------------------------------ */
/*  Modal.Title                                                        */
/* ------------------------------------------------------------------ */

const ModalTitle = forwardRef<
  HTMLHeadingElement,
  Dialog.DialogTitleProps
>(({ children, className = "", ...props }, ref) => {
  const isDark = useContext(ModalThemeContext);
  const t = themeTokens(isDark);
  return (
    <Dialog.Title
      ref={ref}
      className={`font-mono text-sm font-bold tracking-[0.2em] uppercase ${t.text} ${className}`}
      {...props}
    >
      {children}
    </Dialog.Title>
  );
});
ModalTitle.displayName = "Modal.Title";

/* ------------------------------------------------------------------ */
/*  Modal.Description                                                  */
/* ------------------------------------------------------------------ */

const ModalDescription = forwardRef<
  HTMLParagraphElement,
  Dialog.DialogDescriptionProps
>(({ children, className = "", ...props }, ref) => {
  const isDark = useContext(ModalThemeContext);
  const t = themeTokens(isDark);
  return (
    <Dialog.Description
      ref={ref}
      className={`mt-1 font-mono text-xs ${t.textMid} ${className}`}
      {...props}
    >
      {children}
    </Dialog.Description>
  );
});
ModalDescription.displayName = "Modal.Description";

/* ------------------------------------------------------------------ */
/*  Modal.Footer                                                       */
/* ------------------------------------------------------------------ */

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ModalFooter({ children, className = "", ...props }: Readonly<ModalFooterProps>) {
  const isDark = useContext(ModalThemeContext);
  const t = themeTokens(isDark);
  return (
    <div
      className={`mt-6 pt-4 border-t ${t.border} flex items-center justify-end gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal.Close                                                        */
/* ------------------------------------------------------------------ */

const ModalClose = forwardRef<
  HTMLButtonElement,
  Dialog.DialogCloseProps
>(({ children, className = "", ...props }, ref) => (
  <Dialog.Close ref={ref} className={className} asChild {...props}>
    {children}
  </Dialog.Close>
));
ModalClose.displayName = "Modal.Close";

/* ------------------------------------------------------------------ */
/*  Attach sub-components                                              */
/* ------------------------------------------------------------------ */

Modal.Trigger = ModalTrigger;
Modal.Content = ModalContent;
Modal.Title = ModalTitle;
Modal.Description = ModalDescription;
Modal.Footer = ModalFooter;
Modal.Close = ModalClose;

export default Modal;
