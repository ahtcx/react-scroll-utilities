import type { ComponentProps } from "react";

import { useLayoutEffect, useRef, useState } from "react";

import { tuple } from "../../utilities/tuple";

const DEFAULT_ITEM_ESTIMATED_SIZE = 38;
const DEFAULT_OVERSCAN = 0;

export interface VirtualListOptions {
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly overscan?: number;
}

export const useVirtualList = <T>(
	items: readonly T[],
	{ ResizeObserver = window.ResizeObserver, overscan = DEFAULT_OVERSCAN }: VirtualListOptions = {}
) => {
	const [containerScrollOffset, setContainerScrollOffset] = useState(0);
	const [containerSize, setContainerSize] = useState(250);

	const [itemEstimatedSize, setItemEstimatedSize] = useState(DEFAULT_ITEM_ESTIMATED_SIZE);

	const containerElementRef = useRef<HTMLDivElement>(null);
	const containerElement = containerElementRef.current;

	useLayoutEffect(() => {
		if (!containerElement) {
			return;
		}

		if (ResizeObserver) {
			const ro = new ResizeObserver((entries) =>
				entries.forEach(({ contentRect }) => setContainerSize(contentRect.height))
			);

			ro.observe(containerElement);
		}

		setContainerSize(containerElement.clientHeight);
	}, [containerElement]);

	// const containerElementHeight = containerElement?.clientHeight ?? 250;

	const itemElementsRef = useRef<readonly HTMLDivElement[]>([]);
	const [itemElementSizes, setItemElementSizes] = useState<readonly (number | undefined)[]>(
		Array.from({ length: items.length })
	);

	let startOffsetTop = 0;
	let startIndex: number;

	let endOffsetTop = 0;
	let endIndex: number;

	let currentOffsetTop = 0;
	let currentIndex = 0;

	itemElementSizes.forEach((itemElementSize, index) => {
		if (startIndex === undefined && currentOffsetTop > containerScrollOffset - overscan) {
			startOffsetTop = currentOffsetTop;
			startIndex = currentIndex;
		}

		if (endIndex === undefined && currentOffsetTop > containerScrollOffset + containerSize + overscan) {
			endOffsetTop = currentOffsetTop;
			endIndex = index;
		}

		currentOffsetTop += itemElementSize ?? itemEstimatedSize;
		currentIndex = index;
	});

	const scrollHeight = currentOffsetTop;

	const getContainerProps = (props: ComponentProps<"div"> = {}): ComponentProps<"div"> => ({
		ref: containerElementRef,
		onScroll: (event) => setContainerScrollOffset(event.currentTarget.scrollTop),
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

		const index = startIndex + offsetIndex;

		if (index === startIndex) {
			style.marginTop = startOffsetTop - (itemElementSizes[index] ?? itemEstimatedSize);
		}

		if (index === endIndex - 1) {
			style.marginBottom = scrollHeight - endOffsetTop;
		}

		return {
			...props,
			key: index,
			style,
		};
	};

	return tuple(items.slice(startIndex!, endIndex!), { getContainerProps, getItemProps });
};
