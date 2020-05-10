import { getArraySum } from "./getArraySum";

export const getArrayMean = (values: readonly number[]) => getArraySum(values) / values.length;
