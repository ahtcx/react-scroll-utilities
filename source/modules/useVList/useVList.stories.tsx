import * as React from "react";

import { useVList } from "./useVList";

export default { title: "useVList" };

export const VList: React.FC = () => {
	const items = Array.from({ length: 10000 }, (_, index) => index);

	const [{ ref, onScroll }, virtualItems, { getItemOffset, getItemSize }] = useVList(items);

	return (
		<div ref={ref} onScroll={onScroll} style={{ overflowY: "auto", height: 250 }}>
			{virtualItems.map(({ ref, key, item, style, index }) => (
				<div ref={ref} key={key} style={{ ...style, backgroundColor: index % 2 ? "#eee" : undefined }}>
					item <span style={{ fontSize: 32 }}>{item}</span>
					<div>offset: {getItemOffset(index)}</div>
					<div>size: {getItemSize(index)}</div>
				</div>
			))}
		</div>
	);
};
