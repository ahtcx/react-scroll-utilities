export const replaceNaNWithUndefined = (value: number) => {
	if (isNaN(value)) {
		return undefined;
	}

	return value;
};
