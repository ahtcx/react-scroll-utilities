import * as React from "react";

import { useVirtualList } from "./useVirtualList";

export default { title: "useVirtualList" };

export const withText = () => {
	const items = Array.from({ length: 10000 }, (_, index) => index);

	const [virtualizedItems, { getContainerProps, getItemProps }] = useVirtualList(items, { overscan: 200 });

	return (
		<div {...getContainerProps({ style: { height: 250 } })}>
			{virtualizedItems.map((item, index) => (
				<div {...getItemProps(index)}>
					item <span style={{ fontSize: 32 }}>{item}</span>
				</div>
			))}
		</div>
	);
};
