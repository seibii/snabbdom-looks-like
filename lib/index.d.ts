import { VNode } from 'snabbdom';
export declare function Wildcard(): VNode;
export declare function assertLooksLike(actual: VNode | string, expected: VNode | string | Symbol, longError?: boolean): void;
export declare function looksLike(actual: VNode | string, expected: VNode | string): boolean;
