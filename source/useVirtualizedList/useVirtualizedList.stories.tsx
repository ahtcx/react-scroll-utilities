import * as React from "react";

import { useVirtualizedList } from "./useVirtualizedList";

export default { title: "useVirtualList" };

export const VirtualList: React.FC = () => {
	const items = Array.from({ length: 20000 }, (_, index) => index);

	const [{ ref, onScroll }, virtualItems] = useVirtualizedList(items);

	return (
		<div ref={ref} onScroll={onScroll} style={{ overflowY: "auto", height: 250 }}>
			{virtualItems.map(({ ref, key, style, item, offset, size }) => (
				<div ref={ref} key={key} style={style}>
					item <span style={{ fontSize: 32 }}>{item}</span>
					<div>offset: {offset}</div>
					<div>size: {size}</div>
				</div>
			))}
		</div>
	);
};
