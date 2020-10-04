import { useLayoutEffect, useRef, RefObject } from "react";

import { clamp } from "../../utilities/clamp";
import { getArrayMean } from "../../utilities/getArrayMean";
import { isTypeof } from "../../utilities/isTypeof";
import { useForceUpdate } from "../../utilities/useForceUpdate";

export type Maybe<T> = T | null;

const DEFAULT_RESIZE_OBSERVER: VirtualListOptions["ResizeObserver"] = window.ResizeObserver;
const DEFAULT_GET_ITEM_ESTIMATED_SIZE: VirtualListOptions["getItemEstimatedSize"] = getArrayMean;
const DEFAULT_GET_ITEM_KEY: VirtualListOptions["getItemKey"] = (_, index) => index;
const DEFAULT_INITIAL_CONTAINER_SIZE: VirtualListOptions["initialContainerSize"] = 0;
const DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE: VirtualListOptions["initialItemEstimatedSize"] = 100;
const DEFAULT_OVERSCAN: VirtualListOptions["overscan"] = 100;

export const IndexSymbol = Symbol();

export interface VirtualListOptions<T = any, ContainerElement extends HTMLElement = any> {
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly containerElementRef?: RefObject<ContainerElement>;
	readonly getItemEstimatedSize?: (sizes: number[]) => number;
	readonly getItemKey?: (item: T, index: number) => string | number;
	readonly initialContainerSize?: number;
	readonly initialItemEstimatedSize?: number;
	readonly overscan?: number;
}

export const useVirtualList = <T, ContainerElement extends HTMLElement = any, ItemElement extends HTMLElement = any>(
	items: readonly T[],
	{
		ResizeObserver = DEFAULT_RESIZE_OBSERVER,
		containerElementRef: passedContainerElementRef,
		getItemEstimatedSize = DEFAULT_GET_ITEM_ESTIMATED_SIZE,
		getItemKey = DEFAULT_GET_ITEM_KEY,
		initialContainerSize = DEFAULT_INITIAL_CONTAINER_SIZE,
		initialItemEstimatedSize = DEFAULT_INITIAL_ITEM_ESTIMATED_SIZE,
		overscan = DEFAULT_OVERSCAN,
	}: VirtualListOptions<T, ContainerElement> = {}
) => {
	const forceUpdate = useForceUpdate();

	const resizeObserverRef = useRef<ResizeObserver>();

	const defaultContainerElementRef = useRef<ContainerElement>(null);
	const containerElementRef = passedContainerElementRef ?? defaultContainerElementRef;
	const containerSizeRef = useRef(initialContainerSize);
	const containerScrollOffsetRef = useRef(0);

	const itemElementsRef = useRef<Maybe<ItemElement>[]>([]);
	// TODO: these aren't correctly typed as (number | undefined)[]
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
		ref: containerElementRef,
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
		style: {
			overflowY: "auto",
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

		const style: React.CSSProperties = {};
		if (index === startIndex) {
			style.marginTop = getItemOffset(startIndex);
		}
		if (index === endIndex) {
			style.marginBottom = scrollHeight - getItemOffset(endIndex) - getItemSize(endIndex);
		}

		return {
			index,
			item,
			ref,
			style,
			key: getItemKey(item, index),
			offset: getItemOffset(index),
			size: getItemSize(index),
		} as const;
	});

	const helpers = { getItemOffset, getItemSize };

	return [containerProps, virtualItems, helpers] as const;
};
