import type { ComponentProps } from "react";

import { useRef, useState } from "react";

import { tuple } from "../../utilities/tuple";

const DEFAULT_OVERSCAN = 0;

export interface VirtualListOptions {
	readonly overscan?: number;
}

export const useVirtualList = <T>(items: readonly T[], { overscan = DEFAULT_OVERSCAN }: VirtualListOptions = {}) => {
	const [scrollTop, setScrollTop] = useState(0);
	const [estimatedHeight, setAverageHeight] = useState(38);

	const containerElementRef = useRef<HTMLDivElement>(null);
	const containerElement = containerElementRef.current;
	const containerElementHeight = containerElement?.clientHeight ?? 250;

	const [itemElementHeights, setItemElementHeights] = useState<readonly (number | undefined)[]>(
		Array.from({ length: items.length })
	);

	let startOffsetTop = 0;
	let startIndex: number | undefined;

	let endOffsetTop = 0;
	let endIndex: number | undefined;

	let currentOffsetTop = 0;
	let currentIndex = 0;

	itemElementHeights.forEach((itemElementHeight, index) => {
		if (typeof startIndex === "undefined" && currentOffsetTop > scrollTop - overscan) {
			startOffsetTop = currentOffsetTop;
			startIndex = currentIndex;
		}

		if (typeof endIndex === "undefined" && currentOffsetTop >= scrollTop + containerElementHeight - overscan) {
			endOffsetTop = currentOffsetTop;
			endIndex = index;
		}

		currentOffsetTop += itemElementHeight ?? estimatedHeight;
		currentIndex = index;
	});
	const scrollHeight = currentOffsetTop;

	const getContainerProps = (props: ComponentProps<"div"> = {}): ComponentProps<"div"> => ({
		ref: containerElementRef,
		onScroll: (event) => setScrollTop(event.currentTarget.scrollTop),
		style: {
			...props.style,
			overflowY: "auto",
			willChange: "transform",
		},
	});

	const getItemProps = (offsetIndex: number, props: ComponentProps<"div"> = {}): ComponentProps<"div"> => {
		const style: React.CSSProperties = {
			...props.style,
		};

		const index = startIndex! + offsetIndex;

		if (index === startIndex) {
			style.marginTop = startOffsetTop - (itemElementHeights[index] ?? estimatedHeight);
		}

		if (index === endIndex! - 1) {
			style.marginBottom = scrollHeight - endOffsetTop;
		}

		return {
			...props,
			key: index,
			style,
		};
	};

	return tuple(items.slice(startIndex, endIndex), { getContainerProps, getItemProps });
};
