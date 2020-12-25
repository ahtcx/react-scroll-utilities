import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { getArrayMean } from "../utilities/getArrayMean";
import { isTypeof } from "../utilities/isTypeof";
import { replaceNaNWithUndefined } from "../utilities/replaceNaNWithUndefined";
import { useForceUpdate } from "../utilities/useForceUpdate";

export type Maybe<T> = T | null;

const DEFAULT_RESIZE_OBSERVER: VirtualizedListOptions["ResizeObserver"] = window.ResizeObserver;
const DEFAULT_GET_ITEM_ESTIMATED_SIZE: VirtualizedListOptions["getItemEstimatedSize"] = getArrayMean;
const DEFAULT_GET_ITEM_KEY: VirtualizedListOptions["getItemKey"] = (_, index) => index;
const DEFAULT_INITIAL_CONTAINER_SIZE: VirtualizedListOptions["initialContainerSize"] = 0;
const DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE: VirtualizedListOptions["initialItemEstimatedSize"] = 50;
const DEFAULT_OVERSCAN: VirtualizedListOptions["overscan"] = 50;

export const IndexSymbol = Symbol();

export interface VirtualizedListOptions<Item = any, ContainerElement extends HTMLElement = any> {
	ResizeObserver?: typeof ResizeObserver;
	containerElementRef?: RefObject<ContainerElement>;
	getItemEstimatedSize?: (sizes: number[]) => number;
	getItemKey?: (item: Item, index: number) => string | number;
	initialContainerSize?: number;
	initialItemEstimatedSize?: number;
	overscan?: number;
}

export const useVirtualizedList = <
	Item,
	ContainerElement extends HTMLElement = any,
	ItemElement extends HTMLElement = any
>(
	items: Item[],
	{
		ResizeObserver = DEFAULT_RESIZE_OBSERVER,
		containerElementRef: passedContainerElementRef,
		getItemEstimatedSize: initialGetItemEstimatedSize = DEFAULT_GET_ITEM_ESTIMATED_SIZE,
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

	const itemElementsRef = useRef<Maybe<ItemElement>[]>([]);

	const itemOffsetsRef = useRef<(number | undefined)[]>(Array.from({ length: items.length }));
	/** Get item element's offset relative to list start in pixels. */
	const getItemOffset = useCallback(
		/**
		 * @param index Item index.
		 */
		(index: number) => {
			const itemOffset = itemOffsetsRef.current[index];
			if (isNaN(itemOffset!)) {
				return undefined;
			}

			return itemOffset;
		},
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
		(index: number) => {
			const itemSize = itemSizesRef.current[index];
			if (isNaN(itemSize!)) {
				return undefined;
			}

			return itemSize;
		},
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

	const getItemEstimatedSize = useCallback(
		() =>
			replaceNaNWithUndefined(initialGetItemEstimatedSize(itemSizesRef.current.filter(isTypeof("number")))) ??
			initialItemEstimatedSize,
		[initialGetItemEstimatedSize, initialItemEstimatedSize]
	);

	/** Calculate current values. */
	const calculateCurrentValues = useCallback(() => {
		let newStartIndex: number;
		let newEndIndex: number;

		const containerSize = containerElementRef.current?.clientHeight ?? initialContainerSize;
		const containerScrollOffset = containerElementRef.current?.scrollTop ?? 0;

		const newScrollHeight =
			itemOffsetsRef.current.reduce<number>((previousValue, _, currentIndex) => {
				const containerCurrentOffset = currentIndex
					? previousValue + (getItemSize(currentIndex - 1) || getItemEstimatedSize())
					: 0;

				if (newStartIndex === undefined && containerCurrentOffset > Math.max(0, containerScrollOffset - overscan)) {
					newStartIndex = currentIndex - 1;
				}
				if (newEndIndex === undefined && containerCurrentOffset >= containerScrollOffset + containerSize + overscan) {
					newEndIndex = currentIndex - 1;
				}

				setItemOffset(currentIndex, containerCurrentOffset);
				return containerCurrentOffset;
			}, 0) + (getItemSize(items.length - 1) || getItemEstimatedSize());

		newStartIndex = Math.max(newStartIndex! ?? 0, 0);
		newEndIndex = Math.min(newEndIndex! ?? items.length - 1, items.length - 1);

		return { newStartIndex, newEndIndex, newScrollHeight };
	}, [
		containerElementRef,
		getItemEstimatedSize,
		getItemSize,
		initialContainerSize,
		items.length,
		overscan,
		setItemOffset,
	]);

	const currentValues = calculateCurrentValues();

	const [startIndex, setStartIndex] = useState(currentValues.newStartIndex);
	const [endIndex, setEndIndex] = useState(currentValues.newEndIndex);
	const [scrollHeight, setScrollHeight] = useState(currentValues.newScrollHeight);

	const calculateAndUpdateCurrentValues = useCallback(() => {
		const { newStartIndex, newEndIndex, newScrollHeight } = calculateCurrentValues();

		setStartIndex(newStartIndex);
		setEndIndex(newEndIndex);
		setScrollHeight(newScrollHeight);
	}, [calculateCurrentValues]);

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
			// calculateAndUpdateCurrentValues();
			forceUpdate();
		};

		const handleResizeObserverItemEntry = (entry: ResizeObserverEntry) => {
			// @ts-ignore
			const index: number = entry.target[IndexSymbol];

			if (getItemSize(index) !== entry.contentRect.height) {
				setItemSize(index, entry.contentRect.height);
				calculateAndUpdateCurrentValues();
			}
		};

		const handleResizeObserverEntry = (entry: ResizeObserverEntry) =>
			entry.target === containerElement
				? handleResizeObserverContainerEntry(entry)
				: handleResizeObserverItemEntry(entry);

		resizeObserverRef.current = new ResizeObserver((entries) => {
			window.requestAnimationFrame(() => entries.forEach(handleResizeObserverEntry));
		});
		resizeObserverRef.current.observe(containerElement);

		return () => resizeObserverRef.current?.disconnect();
	}, [ResizeObserver, containerElementRef, forceUpdate, getItemSize, setItemSize, calculateAndUpdateCurrentValues]);

	const containerProps = {
		ref: containerElementRef,
		onScroll: calculateAndUpdateCurrentValues,
		style: {
			overflowY: "auto",
		},
	};

	// subset of passed items to be displayed
	const virtualizedItems = items.slice(startIndex, endIndex + 1).map((item, offsetIndex) => {
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

		const style: React.CSSProperties = {};
		if (index === startIndex) {
			style.marginTop = getItemOffset(startIndex);
		}
		if (index === endIndex) {
			style.marginBottom =
				scrollHeight - (getItemOffset(endIndex) ?? 0) - (getItemSize(endIndex) ?? getItemEstimatedSize());
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

	const helpers = {
		/** Index of first virtualized item rendered. */
		startIndex,
		/** Index of last virtualized item rendered. */
		endIndex,
		/** Total scroll height. */
		scrollHeight,
		getItemOffset,
		getItemSize,
	};

	return [containerProps, virtualizedItems, helpers] as const;
};
