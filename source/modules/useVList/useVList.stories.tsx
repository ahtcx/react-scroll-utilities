import * as React from "react";

import { useVList } from "./useVList";

export default { title: "useVList" };

export const VList: React.FC = () => {
	const items = Array.from({ length: 20000 }, (_, index) => index);

	const [{ ref, onScroll }, style, virtualItems, { getItemOffset, getItemSize }] = useVList(items);

	return (
		<div ref={ref} onScroll={onScroll} style={{ overflowY: "auto", height: 250 }}>
			<div style={style}>
				{virtualItems.map(({ ref, key, item, index }) => (
					<div ref={ref} key={key}>
						item <span style={{ fontSize: 32 }}>{item}</span>
						<div>offset: {getItemOffset(index)}</div>
						<div>size: {getItemSize(index)}</div>
					</div>
				))}
			</div>
		</div>
	);
};
