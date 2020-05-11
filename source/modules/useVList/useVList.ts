import { useLayoutEffect, useRef } from "react";

import { getArrayMean } from "../../utilities/getArrayMean";
import { useForceUpdate } from "../../utilities/useForceUpdate";

export type MaybeElement<T extends Element> = T | null;

export type VListOrientation = "horizontal" | "vertical";

const DEFAULT_RESIZE_OBSERVER: VListOptions["ResizeObserver"] = window.ResizeObserver;
const DEFAULT_GET_ITEM_ESTIMATED_SIZE: VListOptions["getItemEstimatedSize"] = getArrayMean;
const DEFAULT_GET_ITEM_KEY: VListOptions["getItemKey"] = (_, index) => index;
const DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE: VListOptions["initialItemEstimatedSize"] = 50;
const DEFAULT_ORIENTATION: VListOptions["orientation"] = "vertical";
const DEFAULT_OVERSCAN: VListOptions["overscan"] = 10;

export const IndexSymbol = Symbol();

export interface VListOptions<T = any> {
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly getItemEstimatedSize?: (sizes: number[]) => number;
	readonly getItemKey?: (item: T, index: number) => string | number;
	readonly initialItemEstimatedSize?: number;
	readonly orientation?: VListOrientation;
	readonly overscan?: number;
}

export const useVList = <T, ContainerElement extends HTMLElement = any, ItemElement extends HTMLElement = any>(
	items: readonly T[],
	{
		ResizeObserver = DEFAULT_RESIZE_OBSERVER,
		getItemEstimatedSize = DEFAULT_GET_ITEM_ESTIMATED_SIZE,
		getItemKey = DEFAULT_GET_ITEM_KEY,
		initialItemEstimatedSize = DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE,
		orientation = DEFAULT_ORIENTATION,
		overscan = DEFAULT_OVERSCAN
	}: VListOptions<T> = {}
) => {
	const forceUpdate = useForceUpdate();

	const containerElementRef = useRef<MaybeElement<ContainerElement>>(null);
	const containerSizeRef = useRef(0);
	const containerSize = containerSizeRef.current;

	const itemElementsResizeObserverRef = useRef<ResizeObserver>();
	const itemElementsRef = useRef<MaybeElement<ItemElement>[]>([]);
	const itemElementOffsetsRef = useRef<number[]>(Array.from({ length: items.length }));
	const itemElementSizesRef = useRef<number[]>(Array.from({ length: items.length }));

	const itemEstimatedSize = getItemEstimatedSize(itemElementSizesRef.current) || initialItemEstimatedSize;

	const containerScrollOffsetRef = useRef(0);

	const getItemSize = (index: number) => itemElementSizesRef.current[index] ?? itemEstimatedSize;
	const getItemOffset = (index: number) => itemElementOffsetsRef.current[index];

	let startIndex: number;
	let endIndex: number;

	const scrollHeight =
		itemElementOffsetsRef.current.reduce((previousValue, _, currentIndex) => {
			const containerScrollOffset = containerScrollOffsetRef.current;
			const containerCurrentOffset = currentIndex ? previousValue + getItemSize(currentIndex - 1) : 0;

			if (startIndex === undefined && containerCurrentOffset > containerScrollOffset - overscan) {
				startIndex = currentIndex - 1;
			}
			if (endIndex === undefined && containerCurrentOffset > containerScrollOffset + containerSize + overscan) {
				endIndex = currentIndex - 1;
			}

			itemElementOffsetsRef.current[currentIndex] = containerCurrentOffset;
			return containerCurrentOffset;
		}, 0) + getItemSize(itemElementSizesRef.current.length - 1);

	startIndex = Math.max(startIndex! ?? 0, 0);
	endIndex = Math.min(endIndex! ?? items.length - 1, items.length - 1);

	// force a rerender when the container size changes
	useLayoutEffect(() => {
		const containerElement = containerElementRef.current;

		if (!ResizeObserver || !containerElement) {
			return;
		}

		itemElementsResizeObserverRef.current = new ResizeObserver((entries) => {
			for (const entry of entries) {
				// @ts-ignore
				const index: number = entry.target[IndexSymbol];

				if (itemElementSizesRef.current[index] !== entry.contentRect.height) {
					itemElementSizesRef.current[index] = entry.contentRect.height;
					forceUpdate();
				}
			}
		});

		const resizeObserver = new ResizeObserver((entries) => {
			containerSizeRef.current = entries[0].contentRect.height;
			forceUpdate();
		});

		resizeObserver.observe(containerElement);

		return () => resizeObserver.unobserve(containerElement);
	}, [ResizeObserver, forceUpdate]);

	const virtualItemsContainerProps = {
		ref: containerElementRef,
		onScroll: (event: React.UIEvent<ContainerElement>) => {
			containerScrollOffsetRef.current = event.currentTarget.scrollTop;
			forceUpdate();
		}
	};

	// subset of passed items to be displayed
	const virtualItems = items.slice(startIndex, endIndex + 1).map((item, offsetIndex) => {
		const index = startIndex + offsetIndex;

		const ref: React.RefCallback<ItemElement> = (newItemElement) => {
			const itemElements = itemElementsRef.current;
			const itemElementsResizeObserver = itemElementsResizeObserverRef.current;

			// unobserve the previous item element if it exists
			const previousItemElement = itemElements[offsetIndex];
			if (itemElementsResizeObserver && previousItemElement) {
				itemElementsResizeObserver.unobserve(previousItemElement);
			}

			// observe the new item element if it exists and add it's index
			if (itemElementsResizeObserver && newItemElement) {
				// @ts-ignore
				newItemElement[IndexSymbol] = index;
				itemElementsResizeObserver.observe(newItemElement);
			}

			// update the item elements with the new item element
			itemElements[offsetIndex] = newItemElement;
			itemElementsRef.current = itemElements.filter(Boolean);
		};

		const style: React.CSSProperties = {};
		if (index === startIndex) {
			style.marginTop = getItemOffset(index);
		}
		if (index === endIndex) {
			style.marginBottom = scrollHeight - getItemOffset(index) - getItemSize(index);
		}

		return {
			index,
			item,
			ref,
			key: getItemKey(item, index),
			style
		} as const;
	});

	const helpers = { getItemOffset, getItemSize };

	return [virtualItemsContainerProps, virtualItems, helpers] as const;
};
