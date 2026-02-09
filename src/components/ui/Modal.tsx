"use client";

import { forwardRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";

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
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className = "", size = "md", ...props }, ref) => (
    <Dialog.Portal>
      {/* Overlay */}
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

      {/* Panel */}
      <Dialog.Content
        ref={ref}
        className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}

        {/* Close button */}
        <Dialog.Close
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          <svg
            width="16"
            height="16"
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
  )
);
ModalContent.displayName = "Modal.Content";

/* ------------------------------------------------------------------ */
/*  Modal.Title                                                        */
/* ------------------------------------------------------------------ */

const ModalTitle = forwardRef<
  HTMLHeadingElement,
  Dialog.DialogTitleProps
>(({ children, className = "", ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={`text-lg font-semibold text-gray-900 ${className}`}
    {...props}
  >
    {children}
  </Dialog.Title>
));
ModalTitle.displayName = "Modal.Title";

/* ------------------------------------------------------------------ */
/*  Modal.Description                                                  */
/* ------------------------------------------------------------------ */

const ModalDescription = forwardRef<
  HTMLParagraphElement,
  Dialog.DialogDescriptionProps
>(({ children, className = "", ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={`mt-1 text-sm text-gray-500 ${className}`}
    {...props}
  >
    {children}
  </Dialog.Description>
));
ModalDescription.displayName = "Modal.Description";

/* ------------------------------------------------------------------ */
/*  Modal.Footer                                                       */
/* ------------------------------------------------------------------ */

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ModalFooter({ children, className = "", ...props }: Readonly<ModalFooterProps>) {
  return (
    <div
      className={`mt-6 flex items-center justify-end gap-2 ${className}`}
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
