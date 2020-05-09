export const getArrayMean = (values: number[]) =>
	values.reduce((previousValue, currentValue) => previousValue + currentValue, 0) / values.length;
