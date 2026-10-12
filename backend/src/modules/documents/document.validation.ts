import { z } from "zod";
export const createDocumentSchema=z.object({title:z.string().trim().min(1).max(500),content:z.string().max(2_000_000).optional().default(""),position:z.number().int().nonnegative().optional(),type:z.enum(["APPENDIX","CUSTOM"]).optional().default("CUSTOM")}).strict();
export const updateDocumentSchema=z.object({title:z.string().trim().min(1).max(500).optional(),content:z.string().max(2_000_000).optional(),position:z.number().int().nonnegative().optional(),isEnabled:z.boolean().optional()}).strict().refine(v=>Object.keys(v).length>0,"At least one field is required");
