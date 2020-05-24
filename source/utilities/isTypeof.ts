const getTypeofValue = (value: any) => typeof value;
type TypeofReturnType = ReturnType<typeof getTypeofValue>;

export const isTypeof = (type: TypeofReturnType) => (value: any) => typeof value === type;
