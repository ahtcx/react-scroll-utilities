import type { ComponentProps } from "react";

import { useLayoutEffect, useRef, useState } from "react";

import { getArrayMean } from "../../utilities/getArrayMean";

export type MaybeElement<T extends HTMLElement> = T | null;

const DEFAULT_RESIZE_OBSERVER: VirtualListOptions["ResizeObserver"] = window.ResizeObserver;
const DEFAULT_GET_ITEM_ESTIMATED_SIZE: VirtualListOptions["getItemEstimatedSize"] = getArrayMean;
const DEFAULT_GET_ITEM_KEY: VirtualListOptions["getItemKey"] = (_, index) => index;
const DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE: VirtualListOptions["initialItemEstimatedSize"] = 38;
const DEFAULT_OVERSCAN: VirtualListOptions["overscan"] = 0;

export interface VirtualListOptions<T = any> {
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly getItemEstimatedSize?: (sizes: number[]) => number;
	readonly getItemKey?: (item: T, index: number) => string | number;
	readonly initialItemEstimatedSize?: number;
	readonly overscan?: number;
}

export const useVirtualList = <T, ContainerElement extends HTMLElement = any, ItemElement extends HTMLElement = any>(
	items: readonly T[],
	{
		ResizeObserver = DEFAULT_RESIZE_OBSERVER,
		getItemEstimatedSize = DEFAULT_GET_ITEM_ESTIMATED_SIZE,
		getItemKey = DEFAULT_GET_ITEM_KEY,
		initialItemEstimatedSize = DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE,
		overscan = DEFAULT_OVERSCAN,
	}: VirtualListOptions<T> = {}
) => {
	//
	const containerElementRef = useRef<MaybeElement<ContainerElement>>(null);
	const [containerSize, setContainerSize] = useState<number>(0);

	const itemElementsRef = useRef<readonly MaybeElement<ItemElement>[]>([]);
	const [itemElementSizes, setItemElementSizes] = useState<number[]>(Array.from({ length: items.length }));

	const itemEstimatedSize = getItemEstimatedSize(itemElementSizes) || initialItemEstimatedSize;

	const [containerScrollOffset, setContainerScrollOffset] = useState(0);

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

		if (
			endIndex === undefined &&
			(currentOffsetTop > containerScrollOffset + containerSize + overscan || index === items.length)
		) {
			endOffsetTop = currentOffsetTop;
			endIndex = index;
		}

		currentOffsetTop += itemElementSizes[index] ?? itemEstimatedSize;
		currentIndex = index;
	});

	const scrollHeight = currentOffsetTop;

	//
	// GOTTA START HERE
	//

	useLayoutEffect(() => {
		const containerElement = containerElementRef.current;
		setContainerSize(containerElement?.clientHeight ?? 0);

		if (!ResizeObserver || !containerElement) {
			return;
		}

		const resizeObserver = new ResizeObserver((entries) => setContainerSize(entries[0].contentRect.height));
		resizeObserver.observe(containerElement);

		return () => resizeObserver.unobserve(containerElement);
	}, [ResizeObserver]);

	//
	//
	//

	//
	// WILL END HERE
	//

	const virtualItemsContainerProps = {
		ref: containerElementRef,
		onScroll: (event) => setContainerScrollOffset(event.currentTarget.scrollTop),
		style: {
			// ...props.style,
			overflowY: "auto",
		} as React.CSSProperties,
	};

	const virtualItems = items.slice(startIndex!, endIndex!).map((item, offsetIndex) => {
		const index = startIndex + offsetIndex;

		const ref: React.RefCallback<ItemElement> = (itemElement) => {
			const newItemElements = [...itemElementsRef.current.filter(Boolean)];
			newItemElements.splice(offsetIndex, 1, itemElement);
			itemElementsRef.current = newItemElements;
		};

		const style: React.CSSProperties = {};
		if (index === startIndex) {
			style.marginTop = startOffsetTop - (itemElementSizes[index] ?? itemEstimatedSize);
		}
		if (index === endIndex - 1) {
			style.marginBottom = scrollHeight - endOffsetTop;
		}

		return {
			item,
			ref,
			key: getItemKey(item, index),
			style,
		} as const;
	});

	return [virtualItemsContainerProps, virtualItems] as const;
};
