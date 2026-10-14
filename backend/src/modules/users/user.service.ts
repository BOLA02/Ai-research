import { AppError } from "../../shared/errors";
import * as repository from "./user.repository";
import { scoreReadiness, type ReadinessAnswers } from "./onboarding";
type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  experienceLevel: string | null;
  onboardedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Pick fields explicitly: callers sometimes pass a full database row, and the
// password hash must never reach a response.
const publicUser = (user: UserRow) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role.toLowerCase() as "student" | "admin",
  isActive: user.isActive,
  experienceLevel: user.experienceLevel,
  onboardedAt: user.onboardedAt ? user.onboardedAt.toISOString() : null,
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
export async function completeOnboarding(id: string, input: { answers?: ReadinessAnswers }) {
  const experienceLevel = input.answers ? scoreReadiness(input.answers) : null;
  return publicUser(await repository.setOnboarding(id, { experienceLevel, onboardedAt: new Date() }));
}
export { publicUser };
