import { useCallback, useState } from "react";

export const useForceUpdate = () => {
	const [, dispatch] = useState(Object.create(null));
	return useCallback(
		/** Force a re-render. */
		() => dispatch(Object.create(null)),
		[dispatch]
	);
};
