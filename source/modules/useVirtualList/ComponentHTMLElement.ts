import * as React from "react";

export type ComponentHTMLElement<Component extends React.ElementType> = React.ComponentProps<
	Component
> extends React.DetailedHTMLProps<React.HTMLAttributes<infer Element>, infer Element>
	? Element
	: unknown;
