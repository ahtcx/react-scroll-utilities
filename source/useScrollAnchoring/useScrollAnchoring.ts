import { useLayoutEffect, useRef } from "react";

import { getDistanceToEdge, ScrollAnchorEdge } from "../utilities/getDistanceToEdge";

const DEFAULT_DISTANCE_TO_EDGE_THRESHOLD: UseScrollAnchoringOptions["distanceToEdgeThreshold"] = 1000;
const DEFAULT_EDGE: UseScrollAnchoringOptions["edge"] = "bottom";
const DEFAULT_SCROLL_TO: UseScrollAnchoringOptions["scrollTo"] = (containerElement, { left, top }) =>
	containerElement.scrollTo({ left, top });
const DEFAULT_RESIZE_OBSERVER: UseScrollAnchoringOptions["ResizeObserver"] = window.ResizeObserver;

export interface UseScrollAnchoringOptions<ContainerElement extends HTMLElement = HTMLElement> {
	edge?: ScrollAnchorEdge;
	scrollTo?: (containerElement: ContainerElement, offset: { left?: number; top?: number }) => void;
	distanceToEdgeThreshold?: number;
	ResizeObserver?: typeof ResizeObserver;
}

export const useScrollAnchoring = <ContainerElement extends HTMLElement, ContentElement extends HTMLElement>({
	distanceToEdgeThreshold = DEFAULT_DISTANCE_TO_EDGE_THRESHOLD,
	edge = DEFAULT_EDGE,
	scrollTo = DEFAULT_SCROLL_TO,
	ResizeObserver = DEFAULT_RESIZE_OBSERVER
}: UseScrollAnchoringOptions<ContainerElement> = {}) => {
	const distanceToEdgeRef = useRef(0);

	const containerElementRef = useRef<ContainerElement>(null);
	const contentElementRef = useRef<ContentElement>(null);

	const handleScroll = (event: React.UIEvent) => {
		distanceToEdgeRef.current = getDistanceToEdge(event.currentTarget, edge);
	};

	const resizeObserverRef = useRef(
		new ResizeObserver(() => {
			const distanceToEdge = distanceToEdgeRef.current;
			const containerElement = containerElementRef.current;

			if (!containerElement) {
				return;
			}

			if (distanceToEdge > distanceToEdgeThreshold) {
				return;
			}

			// prettier-ignore
			const scrollLeft =
				edge === "left" ? distanceToEdge :
				edge === "right" ? containerElement.scrollWidth - distanceToEdge :
				undefined

			// prettier-ignore
			const scrollTop =
				edge === "top" ? distanceToEdge :
				edge === "bottom" ? containerElement.scrollHeight - distanceToEdge :
				undefined

			scrollTo(containerElement, {
				left: scrollLeft,
				top: scrollTop
			});
		})
	);

	useLayoutEffect(() => {
		const distanceToEdge = distanceToEdgeRef.current;
		const containerElement = containerElementRef.current;

		if (!containerElement) {
			return;
		}

		// prettier-ignore
		containerElement.scrollLeft =
			edge === "left" ? distanceToEdge :
			edge === "right" ? containerElement.scrollWidth - distanceToEdge :
			containerElement.scrollLeft

		// prettier-ignore
		containerElement.scrollTop =
			edge === "top" ? distanceToEdge :
			edge === "bottom" ? containerElement.scrollHeight - distanceToEdge :
			containerElement.scrollTop
	}, [edge]);

	useLayoutEffect(() => {
		const containerElement = containerElementRef.current;
		const contentElement = contentElementRef.current;

		if (!containerElement || !contentElement) {
			return;
		}

		const resizeObserver = resizeObserverRef.current;

		resizeObserver.observe(contentElement);
		resizeObserver.observe(containerElement);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	return { handleScroll, containerElementRef, contentElementRef };
};
