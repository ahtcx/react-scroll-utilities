const getTypeofValue = (value: any) => typeof value;
export type TypeofReturnType = ReturnType<typeof getTypeofValue>;

// prettier-ignore
export type TypeFromTypeString<TypeString extends TypeofReturnType> =
	TypeString extends "string" ? string :
	TypeString extends "number" ? number :
	TypeString extends "bigint" ? BigInt :
	TypeString extends "boolean" ? boolean :
	TypeString extends "symbol" ? symbol :
	TypeString extends "undefined" ? undefined :
	TypeString extends "object" ? object :
	TypeString extends "function" ? Function :
	never

export const isTypeof = <TypeString extends TypeofReturnType>(type: TypeString) => (
	value: any
): value is TypeFromTypeString<TypeString> => typeof value === type;
