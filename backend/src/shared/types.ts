export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
