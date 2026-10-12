import { AppError } from "../../shared/errors";
import * as repository from "./user.repository";
const publicUser = (user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...user,
  role: user.role.toLowerCase() as "student" | "admin",
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
export async function getUser(id: string) {
  const user = await repository.findActiveUserById(id);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  return publicUser(user);
}
export async function updateProfile(
  id: string,
  input: { firstName?: string; lastName?: string },
) {
  return publicUser(await repository.updateUser(id, input));
}
export { publicUser };
