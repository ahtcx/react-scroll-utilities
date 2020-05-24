import * as React from "react";

import { useRef } from "react";

import { useVirtualList } from "./useVirtualList";

export default { title: "useVirtualList" };

export const VirtualList: React.FC = () => {
	const items = Array.from({ length: 20000 }, (_, index) => index);

	// const containerRef = useRef<HTMLDivElement>(null);
	const [{ ref, onScroll }, { style }, virtualItems] = useVirtualList(items);

	return (
		<div ref={ref} onScroll={onScroll} style={{ overflowY: "auto", height: 250 }}>
			<div style={style}>
				{virtualItems.map(({ ref, key, item, offset, size }) => (
					<div ref={ref} key={key}>
						item <span style={{ fontSize: 32 }}>{item}</span>
						<div>offset: {offset}</div>
						<div>size: {size}</div>
					</div>
				))}
			</div>
		</div>
	);
};
