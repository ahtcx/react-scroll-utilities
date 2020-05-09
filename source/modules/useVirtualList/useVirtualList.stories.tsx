import * as React from "react";

import { useVirtualList } from "./useVirtualList";

export default { title: "useVirtualList" };

export const WithText: React.FC = () => {
	const items = Array.from({ length: 10 }, (_, index) => index);

	const [{ ref, onScroll, style }, virtualItems] = useVirtualList(items);

	return (
		<div ref={ref} onScroll={onScroll} style={{ ...style, height: 250 }}>
			{virtualItems.map(({ ref, key, item, style }) => (
				<div ref={ref} key={key} style={style}>
					item <span style={{ fontSize: 32 }}>{item}</span>
				</div>
			))}
		</div>
	);
};
