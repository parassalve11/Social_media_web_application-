import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}



export const formatDate = (dateString) => {
	const date = parseISO(dateString);
	return isValid(date) ? format(date, "MMM yyyy") : "Present";
};