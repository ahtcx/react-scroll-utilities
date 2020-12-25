import * as React from "react";

import { useVirtualizedList } from "./useVirtualizedList";

export default { title: "useVirtualizedList" };

export const VirtualizedList: React.FC = () => {
	const items = Array.from({ length: 1000 }, (_, index) => index);

	const [{ ref, onScroll }, virtualItems, { getItemOffset, getItemSize }] = useVirtualizedList(items, { overscan: 0 });

	return (
		<div ref={ref} onScroll={onScroll} style={{ overflowY: "auto", height: 250 }}>
			{virtualItems.map(({ ref, key, item, index, style }) => (
				<div ref={ref} key={key} style={style}>
					item <span style={{ fontSize: 32 }}>{item}</span>
					<div>offset: {getItemOffset(index)}</div>
					<div>size: {getItemSize(index)}</div>
				</div>
			))}
		</div>
	);
};
