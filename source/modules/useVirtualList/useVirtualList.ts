import type { ComponentProps } from "react";

import { useLayoutEffect, useRef, useState } from "react";

import { tuple } from "../../utilities/tuple";

const DEFAULT_ITEM_ESTIMATED_SIZE = 100;
const DEFAULT_OVERSCAN = 0;

export interface VirtualListOptions {
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly overscan?: number;
}

export const useVirtualList = <T>(
	items: readonly T[],
	{ ResizeObserver = window.ResizeObserver, overscan = DEFAULT_OVERSCAN }: VirtualListOptions = {}
) => {
	const containerElementRef = useRef<HTMLDivElement>(null);
	const containerElement = containerElementRef.current;

	const [containerScrollOffset, setContainerScrollOffset] = useState(0);
	const [containerSize, setContainerSize] = useState(0);

	const [itemEstimatedSize, setItemEstimatedSize] = useState(DEFAULT_ITEM_ESTIMATED_SIZE);
	const itemElementSizesRef = useRef<number[]>([]);
	const itemElementSizes = itemElementSizesRef.current;

	let startOffsetTop = 0;
	let startIndex: number;

	let endOffsetTop = 0;
	let endIndex: number;

	let currentOffsetTop = 0;
	let currentIndex = 0;

	items.forEach((_, index) => {
		if (startIndex === undefined && currentOffsetTop > containerScrollOffset - overscan) {
			startOffsetTop = currentOffsetTop;
			startIndex = currentIndex;
		}

		if (endIndex === undefined && currentOffsetTop > containerScrollOffset + containerSize + overscan) {
			endOffsetTop = currentOffsetTop;
			endIndex = index;
		}

		currentOffsetTop += itemElementSizes[index] ?? itemEstimatedSize;
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
		const index = (startIndex ?? 0) + offsetIndex;

		const ref = (itemElement: HTMLDivElement | null) => {
			if (!itemElement) {
				return;
			}

			itemElementSizes[index] = itemElement.clientHeight;
		};

		const style: React.CSSProperties = {
			...props.style,
		};

		if (index === startIndex) {
			style.marginTop = startOffsetTop - (itemElementSizes[index] ?? itemEstimatedSize);
		}

		if (index === endIndex - 1) {
			style.marginBottom = scrollHeight - endOffsetTop;
		}

		return {
			...props,
			ref,
			key: index,
			style,
		};
	};

	useLayoutEffect(() => {
		if (!containerElement) {
			return;
		}

		setContainerSize(containerElement.clientHeight);

		if (!ResizeObserver) {
			return;
		}

		const resizeObserver = new ResizeObserver((entries) =>
			entries.forEach(({ contentRect }) => setContainerSize(contentRect.height))
		);

		resizeObserver.observe(containerElement);

		return () => resizeObserver.unobserve(containerElement);
	}, [containerElement]);

	return tuple(items.slice(startIndex!, endIndex!), { getContainerProps, getItemProps });
};
