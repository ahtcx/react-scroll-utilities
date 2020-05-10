export const getArraySum = (values: readonly number[]) =>
	values.reduce((previousValue, currentValue) => previousValue + currentValue, 0);
