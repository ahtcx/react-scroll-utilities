import { useCallback, useState } from "react";

export const useForceUpdate = () => {
	const [, dispatch] = useState(Object.create(null));
	return useCallback(() => dispatch(Object.create(null)), [dispatch]);
};
