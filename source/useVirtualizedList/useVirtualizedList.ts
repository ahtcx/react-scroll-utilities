import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { getArrayMean } from "../utilities/getArrayMean";
import { isTypeof } from "../utilities/isTypeof";
import { useForceUpdate } from "../utilities/useForceUpdate";

export type Maybe<T> = T | null;

const DEFAULT_RESIZE_OBSERVER: VirtualizedListOptions["ResizeObserver"] = window.ResizeObserver;
const DEFAULT_GET_ITEM_ESTIMATED_SIZE: VirtualizedListOptions["getItemEstimatedSize"] = getArrayMean;
const DEFAULT_GET_ITEM_KEY: VirtualizedListOptions["getItemKey"] = (_, index) => index;
const DEFAULT_INITIAL_CONTAINER_SIZE: VirtualizedListOptions["initialContainerSize"] = 0;
const DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE: VirtualizedListOptions["initialItemEstimatedSize"] = 100;
const DEFAULT_OVERSCAN: VirtualizedListOptions["overscan"] = 100;

export const IndexSymbol = Symbol();

export interface VirtualizedListOptions<T = any, ContainerElement extends HTMLElement = any> {
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly containerElementRef?: RefObject<ContainerElement>;
	readonly getItemEstimatedSize?: (sizes: number[]) => number;
	readonly getItemKey?: (item: T, index: number) => string | number;
	readonly initialContainerSize?: number;
	readonly initialItemEstimatedSize?: number;
	readonly overscan?: number;
}

export const useVirtualizedList = <
	Item,
	ContainerElement extends HTMLElement = any,
	ItemElement extends HTMLElement = any
>(
	items: readonly Item[],
	{
		ResizeObserver = DEFAULT_RESIZE_OBSERVER,
		containerElementRef: passedContainerElementRef,
		getItemEstimatedSize = DEFAULT_GET_ITEM_ESTIMATED_SIZE,
		getItemKey = DEFAULT_GET_ITEM_KEY,
		initialContainerSize = DEFAULT_INITIAL_CONTAINER_SIZE,
		initialItemEstimatedSize = DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE,
		overscan = DEFAULT_OVERSCAN,
	}: VirtualizedListOptions<Item, ContainerElement> = {}
) => {
	const forceUpdate = useForceUpdate();

	const resizeObserverRef = useRef<ResizeObserver>();

	const defaultContainerElementRef = useRef<ContainerElement>(null);
	const containerElementRef = passedContainerElementRef ?? defaultContainerElementRef;

	const [startIndex, setStartIndex] = useState<number>();
	const [endIndex, setEndIndex] = useState<number>();
	const [scrollHeight, setScrollHeight] = useState(0);

	const itemElementsRef = useRef<Maybe<ItemElement>[]>([]);

	const itemOffsetsRef = useRef<(number | undefined)[]>(Array.from({ length: items.length }));
	/** Get item element's offset relative to list start in pixels. */
	const getItemOffset = useCallback(
		/**
		 * @param index Item index.
		 */
		(index: number) => itemOffsetsRef.current[index],
		[]
	);
	/** Set item element's offset relative to list start in pixels. */
	const setItemOffset = useCallback(
		/**
		 * @param index Item index.
		 * @param offset Item offset in pixels.
		 */
		(index: number, offset: number) => (itemOffsetsRef.current[index] = offset),
		[]
	);

	const itemSizesRef = useRef<(number | undefined)[]>(Array.from({ length: items.length }));
	/**
	 * Get item element's size in pixels.
	 */
	const getItemSize = useCallback(
		/**
		 * @param index Item index.
		 */
		(index: number) => itemSizesRef.current[index],
		[]
	);
	/**
	 * Set item element's size in pixels.
	 */
	const setItemSize = useCallback(
		/**
		 * @param index Item index.
		 * @param size Item size in pixels.
		 */
		(index: number, size: number) => (itemSizesRef.current[index] = size),
		[]
	);

	const itemEstimatedSize =
		getItemEstimatedSize(itemSizesRef.current.filter(isTypeof("number"))) ?? initialItemEstimatedSize;

	/** Calculate and update current values. */
	const calculateAndUpdateCurrentValues = useCallback(() => {
		let newStartIndex: number;
		let newEndIndex: number;

		const containerSize = containerElementRef.current?.clientHeight ?? initialContainerSize;
		const containerScrollOffset = containerElementRef.current?.scrollTop ?? 0;

		setScrollHeight(
			itemOffsetsRef.current.reduce((previousValue, _, currentIndex) => {
				const containerCurrentOffset = currentIndex
					? (previousValue ?? 0) + (getItemSize(currentIndex - 1) ?? itemEstimatedSize)
					: 0;

				if (newStartIndex === undefined && containerCurrentOffset > Math.max(0, containerScrollOffset - overscan)) {
					newStartIndex = currentIndex - 1;
				}
				if (newEndIndex === undefined && containerCurrentOffset >= containerScrollOffset + containerSize + overscan) {
					newEndIndex = currentIndex - 1;
				}

				setItemOffset(currentIndex, containerCurrentOffset);
				return containerCurrentOffset;
			}, 0) ?? 0 + (getItemSize(itemSizesRef.current.length - 1) ?? itemEstimatedSize)
		);

		setStartIndex(Math.max(newStartIndex! ?? 0, 0));
		setEndIndex(Math.min(newEndIndex! ?? items.length - 1, items.length - 1));
	}, [
		containerElementRef,
		getItemSize,
		initialContainerSize,
		itemEstimatedSize,
		items.length,
		overscan,
		setItemOffset,
	]);

	useEffect(() => {
		calculateAndUpdateCurrentValues();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [calculateAndUpdateCurrentValues, ...itemOffsetsRef.current, ...itemSizesRef.current]);

	useLayoutEffect(() => {
		const containerElement = containerElementRef.current;
		if (!ResizeObserver || !containerElement) {
			return;
		}

		const handleResizeObserverContainerEntry = (entry: ResizeObserverEntry) => {
			forceUpdate();
		};

		const handleResizeObserverItemEntry = (entry: ResizeObserverEntry) => {
			// @ts-ignore
			const index: number = entry.target[IndexSymbol];

			if (getItemSize(index) !== entry.contentRect.height) {
				setItemSize(index, entry.contentRect.height);
				// forceUpdate();
			}
		};

		const handleResizeObserverEntry = (entry: ResizeObserverEntry) =>
			entry.target === containerElement
				? handleResizeObserverContainerEntry(entry)
				: handleResizeObserverItemEntry(entry);

		resizeObserverRef.current = new ResizeObserver((entries) => entries.forEach(handleResizeObserverEntry));
		resizeObserverRef.current.observe(containerElement);

		return () => resizeObserverRef.current?.disconnect();
	}, [ResizeObserver, containerElementRef, forceUpdate, getItemSize, setItemSize]);

	const containerProps = {
		ref: containerElementRef,
		onScroll: (event: React.UIEvent<ContainerElement>) => {
			// const currentScrollTop = containerScrollOffsetRef.current;
			// const newScrollTop = clamp(event.currentTarget.scrollTop, 0, scrollHeight);
			// containerScrollOffsetRef.current = newScrollTop;
			// if (
			// 	(newScrollTop > currentScrollTop &&
			// 		(newScrollTop >= itemElementsOffsetsRef.current[startIndex + 1] ||
			// 			itemElementsOffsetsRef.current[endIndex + 1] - containerSizeRef.current - newScrollTop < 0)) ||
			// 	(newScrollTop < currentScrollTop &&
			// 		(newScrollTop < itemElementsOffsetsRef.current[startIndex] ||
			// 			itemElementsOffsetsRef.current[endIndex] - containerSizeRef.current - newScrollTop >= 0))
			// ) {
			// 	forceUpdate();
			// }
			calculateAndUpdateCurrentValues();
		},
		style: {
			overflowY: "auto",
		},
	};

	// subset of passed items to be displayed
	const virtualItems = items.slice(startIndex, (endIndex ?? 0) + 1).map((item, offsetIndex) => {
		const index = (startIndex ?? 0) + offsetIndex;

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

		const style: React.CSSProperties = {};
		if (index === startIndex) {
			style.marginTop = getItemOffset(startIndex);
		}
		if (index === endIndex) {
			style.marginBottom = scrollHeight - (getItemOffset(endIndex) ?? 0) - (getItemSize(endIndex) ?? itemEstimatedSize);
		}

		return {
			index,
			item,
			ref,
			style,
			key: getItemKey(item, index),
			offset: getItemOffset(index),
			size: getItemSize(index),
		};
	});

	const helpers = { getItemOffset, getItemSize };

	useLayoutEffect(() => {
		calculateAndUpdateCurrentValues();
	}, [calculateAndUpdateCurrentValues]);

	console.log({ startIndex, endIndex });

	return [containerProps, virtualItems, helpers] as const;
};
