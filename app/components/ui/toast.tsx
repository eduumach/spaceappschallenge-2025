import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "~/lib/utils"

const toastVariants = cva(
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
    {
        variants: {
            variant: {
                default: "border bg-background text-foreground",
                destructive:
                    "destructive border-destructive bg-destructive text-destructive-foreground",
                success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
                warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
    onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
    ({ className, variant, onClose, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(toastVariants({ variant }), className)}
                {...props}
            >
                <div className="flex-1">{children}</div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-foreground/50 opacity-50 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        )
    }
)
Toast.displayName = "Toast"

export { Toast, toastVariants }
