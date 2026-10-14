import type { ReferenceStyle } from "./types";

/** Older projects may hold values like "APA7"; anything starting with APA means APA. */
export const normaliseStyle = (value: string | null | undefined): ReferenceStyle => (value && value.toUpperCase().startsWith("APA") ? "APA" : "IEEE");
