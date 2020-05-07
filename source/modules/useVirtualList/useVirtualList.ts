import type { ComponentProps } from "react";

import { useLayoutEffect, useRef, useState } from "react";

import { tuple } from "../../utilities/tuple";

const DEFAULT_OVERSCAN = 1;

export interface VirtualListOptions {
	readonly overscan?: number;
}

export const useVirtualList = <T>(items: readonly T[], { overscan = DEFAULT_OVERSCAN }: VirtualListOptions = {}) => {
	const [scrollTop, setScrollTop] = useState(0);
	const [averageHeight, setAverageHeight] = useState(10);

	const containerElementRef = useRef<HTMLDivElement>(null);
	const containerElement = containerElementRef.current;

	const [itemElementHeights, setItemElementHeights] = useState<readonly (number | undefined)[]>(
		Array.from({ length: items.length })
	);

	const scrollHeight =
		itemElementHeights.reduce(
			(itemElementHeight, currentValue) => (currentValue ?? 0) + (itemElementHeight ?? averageHeight),
			0
		) ?? 0;

	//

	let startOffsetTop = 0;
	let startIndex = 0;
	itemElementHeights.some((itemElementHeight, index) => {
		if (startOffsetTop >= scrollTop) {
			return true;
		}

		startOffsetTop += itemElementHeight ?? averageHeight;
		startIndex = index;
	});

	let offsetTop = startOffsetTop;
	let endIndex = startIndex;
	itemElementHeights.slice(startIndex).some((itemElementHeight, index) => {
		if (containerElement && offsetTop >= scrollTop + containerElement.clientHeight) {
			return true;
		}

		offsetTop += itemElementHeight ?? averageHeight;
		endIndex = startIndex + index;
	});
	endIndex += 2;

	//

	useLayoutEffect(() => {
		if (!containerElement) {
			return;
		}

		containerElement.scrollTop = scrollTop;
	}, [containerElement, scrollTop]);

	useLayoutEffect(() => {
		if (!containerElement) {
			return;
		}

		setItemElementHeights([...containerElement.children].map(({ clientHeight }) => clientHeight));
	}, [containerElement]);

	const getContainerProps = (props: ComponentProps<"div"> = {}): ComponentProps<"div"> => ({
		ref: containerElementRef,
		onScroll: (event) => setScrollTop(event.currentTarget.scrollTop),
		style: {
			...props.style,
			overflowY: "auto",
		},
	});

	const getItemProps = (offsetIndex: number, props: ComponentProps<"div"> = {}): ComponentProps<"div"> => {
		const style: React.CSSProperties = {
			...props.style,
		};

		const index = startIndex + offsetIndex;

		if (index === startIndex) {
			style.paddingTop = startOffsetTop - (itemElementHeights[index] ?? averageHeight);
		}

		if (index === endIndex - 1) {
			style.paddingBottom = scrollHeight - offsetTop;
		}

		return {
			...props,
			style,
		};
	};

	return tuple(items.slice(startIndex, endIndex), { getContainerProps, getItemProps });
};
