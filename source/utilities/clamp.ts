export const clamp = (value: number, lowerBound: number, upperBound: number) =>
	Math.min(Math.max(value, lowerBound), upperBound);
