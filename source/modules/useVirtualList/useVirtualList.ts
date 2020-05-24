import { useLayoutEffect, useRef, RefObject } from "react";

import { getArrayMean } from "../../utilities/getArrayMean";
import { useForceUpdate } from "../../utilities/useForceUpdate";
import { clamp } from "../../utilities/clamp";
import { isTypeof } from "../../utilities/isTypeof";

export type MaybeElement<T extends Element> = T | null;

export type VirtualListOrientation = "horizontal" | "vertical";

const DEFAULT_RESIZE_OBSERVER: VirtualListOptions["ResizeObserver"] = window.ResizeObserver;
const DEFAULT_GET_ITEM_ESTIMATED_SIZE: VirtualListOptions["getItemEstimatedSize"] = getArrayMean;
const DEFAULT_GET_ITEM_KEY: VirtualListOptions["getItemKey"] = (_, index) => index;
const DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE: VirtualListOptions["initialItemEstimatedSize"] = 50;
// const DEFAULT_ORIENTATION: VirtualListOptions["orientation"] = "vertical";
const DEFAULT_OVERSCAN: VirtualListOptions["overscan"] = 0;

export const IndexSymbol = Symbol();

export interface VirtualListOptions<T = any> {
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly getItemEstimatedSize?: (sizes: number[]) => number;
	readonly getItemKey?: (item: T, index: number) => string | number;
	readonly initialItemEstimatedSize?: number;
	// readonly orientation?: VirtualListOrientation;
	readonly overscan?: number;
}

export const useVirtualList = <ContainerElement extends HTMLElement, T, ItemElement extends HTMLElement = any>(
	containerElementRef: RefObject<ContainerElement>,
	items: readonly T[],
	{
		ResizeObserver = DEFAULT_RESIZE_OBSERVER,
		getItemEstimatedSize = DEFAULT_GET_ITEM_ESTIMATED_SIZE,
		getItemKey = DEFAULT_GET_ITEM_KEY,
		initialItemEstimatedSize = DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE,
		// orientation = DEFAULT_ORIENTATION,
		overscan = DEFAULT_OVERSCAN,
	}: VirtualListOptions<T> = {}
) => {
	const forceUpdate = useForceUpdate();

	const resizeObserverRef = useRef<ResizeObserver>();

	const containerSizeRef = useRef(0);
	const containerScrollOffsetRef = useRef(0);

	const itemElementsRef = useRef<MaybeElement<ItemElement>[]>([]);
	// TODO: these aren't correctly typed as number | undefined, should they be?
	const itemElementsOffsetsRef = useRef<number[]>(Array.from({ length: items.length }));
	const itemElementsSizesRef = useRef<number[]>(Array.from({ length: items.length }));

	const itemEstimatedSize =
		getItemEstimatedSize(itemElementsSizesRef.current.filter(isTypeof("number"))) || initialItemEstimatedSize;

	const getItemSize = (index: number) => itemElementsSizesRef.current[index] ?? itemEstimatedSize;
	const getItemOffset = (index: number) => itemElementsOffsetsRef.current[index];

	let startIndex: number;
	let endIndex: number;

	const scrollHeight =
		itemElementsOffsetsRef.current.reduce((previousValue, _, currentIndex) => {
			const containerSize = containerSizeRef.current;
			const containerScrollOffset = containerScrollOffsetRef.current;
			const containerCurrentOffset = currentIndex ? previousValue + getItemSize(currentIndex - 1) : 0;

			if (startIndex === undefined && containerCurrentOffset > Math.max(0, containerScrollOffset - overscan)) {
				startIndex = currentIndex - 1;
			}
			if (endIndex === undefined && containerCurrentOffset >= containerScrollOffset + containerSize + overscan) {
				endIndex = currentIndex - 1;
			}

			itemElementsOffsetsRef.current[currentIndex] = containerCurrentOffset;
			return containerCurrentOffset;
		}, 0) + getItemSize(itemElementsSizesRef.current.length - 1);

	startIndex = Math.max(startIndex! ?? 0, 0);
	endIndex = Math.min(endIndex! ?? items.length - 1, items.length - 1);

	useLayoutEffect(() => {
		const containerElement = containerElementRef.current;
		if (!ResizeObserver || !containerElement) {
			return;
		}

		const handleResizeObserverContainerEntry = (entry: ResizeObserverEntry) => {
			if (containerSizeRef.current !== entry.contentRect.height) {
				containerSizeRef.current = entry.contentRect.height;
				forceUpdate();
			}
		};

		const handleResizeObserverItemEntry = (entry: ResizeObserverEntry) => {
			// @ts-ignore
			const index: number = entry.target[IndexSymbol];

			if (itemElementsSizesRef.current[index] !== entry.contentRect.height) {
				itemElementsSizesRef.current[index] = entry.contentRect.height;
				forceUpdate();
			}
		};

		const handleResizeObserverEntry = (entry: ResizeObserverEntry) =>
			entry.target === containerElement
				? handleResizeObserverContainerEntry(entry)
				: handleResizeObserverItemEntry(entry);

		resizeObserverRef.current = new ResizeObserver((entries) => entries.forEach(handleResizeObserverEntry));
		resizeObserverRef.current.observe(containerElement);

		return () => resizeObserverRef.current?.disconnect();
	}, [ResizeObserver, containerElementRef, forceUpdate]);

	const containerProps = {
		onScroll: (event: React.UIEvent<ContainerElement>) => {
			const currentScrollTop = containerScrollOffsetRef.current;
			const newScrollTop = clamp(event.currentTarget.scrollTop, 0, scrollHeight);

			containerScrollOffsetRef.current = newScrollTop;

			if (
				(newScrollTop > currentScrollTop &&
					(newScrollTop >= itemElementsOffsetsRef.current[startIndex + 1] ||
						itemElementsOffsetsRef.current[endIndex + 1] - containerSizeRef.current - newScrollTop < 0)) ||
				(newScrollTop < currentScrollTop &&
					(newScrollTop < itemElementsOffsetsRef.current[startIndex] ||
						itemElementsOffsetsRef.current[endIndex] - containerSizeRef.current - newScrollTop >= 0))
			) {
				forceUpdate();
			}
		},
	};

	const wrapperProps = {
		style: {
			paddingTop: getItemOffset(startIndex),
			paddingBottom: scrollHeight - getItemOffset(endIndex) - getItemSize(endIndex),
		},
	};

	// subset of passed items to be displayed
	const virtualItems = items.slice(startIndex, endIndex + 1).map((item, offsetIndex) => {
		const index = startIndex + offsetIndex;

		const ref: React.RefCallback<ItemElement> = (newItemElement) => {
			const itemElements = itemElementsRef.current;
			const resizeObserver = resizeObserverRef.current;

			const previousItemElement = itemElements[offsetIndex];

			if (previousItemElement && resizeObserver) {
				resizeObserver.unobserve(previousItemElement);
			}

			if (newItemElement && resizeObserver) {
				// @ts-ignore
				newItemElement[IndexSymbol] = index;
				resizeObserver.observe(newItemElement);
			}

			// update the item elements with the new item element
			itemElements[offsetIndex] = newItemElement;
			itemElementsRef.current = itemElements.filter(Boolean);
		};

		return {
			index,
			item,
			ref,
			key: getItemKey(item, index),
			offset: getItemOffset(index),
			size: getItemSize(index),
		} as const;
	});

	const helpers = { getItemOffset, getItemSize };

	return [containerProps, wrapperProps, virtualItems, helpers] as const;
};
