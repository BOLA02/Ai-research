import { ProjectMemberRole } from "@prisma/client";
import { AppError } from "../../shared/errors";
import { recordActivity } from "../activity";
import * as repository from "./project.repository";
export function listProjects(userId: string) {
  return repository.listAccessible(userId);
}
export function createProject(
  userId: string,
  input: Parameters<typeof repository.createOwned>[1],
) {
  return repository.createOwned(userId, input).then((project) => {
    recordActivity({ type: "project_created", userId, projectId: project.id, meta: { title: String(project.title).slice(0, 120), template: project.templateId ?? null } });
    return project;
  });
}
export async function getProject(userId: string, projectId: string) {
  const project = await repository.findAccessible(userId, projectId);
  if (!project)
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found");
  const accessRole =
    project.ownerId === userId
      ? ProjectMemberRole.OWNER
      : project.members[0]?.role;
  const { members, ...record } = project;
  return { project: record, accessRole: accessRole?.toLowerCase() };
}
export async function requireProjectWriteAccess(userId: string, projectId: string) {
  const access = await getProject(userId, projectId);
  if (!["owner", "editor"].includes(access.accessRole || ""))
    throw new AppError(403, "PROJECT_UPDATE_FORBIDDEN", "You cannot update this project");
  return access;
}
export async function updateProject(
  userId: string,
  projectId: string,
  input: Parameters<typeof repository.updateById>[1],
) {
  await requireProjectWriteAccess(userId, projectId);
  return repository.updateById(projectId, input);
}
export async function deleteProject(userId: string, projectId: string) {
  const result = await repository.deleteOwned(projectId, userId);
  if (!result.count)
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found");
  recordActivity({ type: "project_deleted", userId, projectId });
}
