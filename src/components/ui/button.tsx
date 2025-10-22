import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
	{
		variants: {
			variant: {
				default: "bg-primary text-white hover:bg-primary/90",
				destructive: "bg-red-600 text-white hover:bg-red-700",
				outline: "border border-gray-300 hover:bg-gray-100",
				secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
				ghost: "hover:bg-gray-100",
				link: "text-blue-600 underline-offset-4 hover:underline",
				hero: "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 transition-transform",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 px-3",
				lg: "h-11 px-8",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size }), className)}
				ref={ref}
				{...props}
			/>
		);
	}
);

Button.displayName = "Button";

export { Button, buttonVariants };
