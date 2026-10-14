import {z} from "zod";const email=z.string().trim().email().max(320).transform(value=>value.toLowerCase());export const loginSchema=z.object({email,password:z.string().min(1).max(256)}).strict();export const signupSchema=z.object({firstName:z.string().trim().min(1).max(100),lastName:z.string().trim().min(1).max(100),email,password:z.string().min(8,"Password must be at least 8 characters").max(256),confirmPassword:z.string()}).strict().refine(value=>value.password===value.confirmPassword,{message:"Passwords do not match",path:["confirmPassword"]});

const newPassword = z.string().min(8, "Password must be at least 8 characters").max(256);
export const forgotPasswordSchema = z.object({ email }).strict();
export const resetPasswordSchema = z.object({ token: z.string().min(20).max(200), password: newPassword, confirmPassword: z.string() }).strict().refine((value) => value.password === value.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
