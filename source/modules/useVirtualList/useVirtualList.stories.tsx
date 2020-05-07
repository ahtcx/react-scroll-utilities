import * as React from "react";

import { useVirtualList } from "./useVirtualList";

export default { title: "useVirtualList" };

export const withText = () => {
	const items = Array.from({ length: 1000 }, (_, index) => index);
	// const items = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));

	const [renderedItems, { getContainerProps, getItemProps }] = useVirtualList(items);

	return (
		<div {...getContainerProps({ style: { height: 250 } })}>
			{renderedItems.map((item, index) => (
				<div {...getItemProps(index)}>
					item <span style={{ fontSize: 32 }}>{item}</span>
				</div>
			))}
		</div>
	);
};
