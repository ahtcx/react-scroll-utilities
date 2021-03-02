export type ScrollAnchorEdge = "top" | "bottom" | "left" | "right";

export const getDistanceToEdge = (element: Element, edge: ScrollAnchorEdge) => {
	switch (edge) {
		case "left": {
			return element.scrollLeft;
		}
		case "right": {
			return element.scrollWidth - element.scrollLeft - element.clientWidth;
		}
		case "top": {
			return element.scrollTop;
		}
		case "bottom": {
			return element.scrollHeight - element.scrollTop - element.clientHeight;
		}
	}

	return 0;
};
