import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type {
	WithoutChild,
	WithoutChildrenOrChild,
	WithoutChildren,
	WithElementRef,
} from "bits-ui";
