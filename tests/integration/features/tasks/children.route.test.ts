// @vitest-environment node

const tasksMock = {
  createLinkableTasks: vi.fn(),
  createTask: vi.fn(),
  createTaskAssets: vi.fn(),
  archiveTask: vi.fn(),
  archiveTasksByIds: vi.fn(),
  deleteTaskAsset: vi.fn(),
  getTaskAssetById: vi.fn(),
  getHighestPositionTask: vi.fn(),
  getLinkableTasks: vi.fn(),
  getTaskById: vi.fn(),
  getTaskCategories: vi.fn(),
  searchTasks: vi.fn(),
  updateTask: vi.fn(),
  generateTaskSeries: vi.fn(),
  deleteTaskSeries: vi.fn(),
  getSeriesTasks: vi.fn(),
};

vi.mock("@/lib/dbService/tasks", () => tasksMock);
vi.mock("@/lib/dbService/events", () => ({
  createEvent: vi.fn(),
  getEventsByWorkspaceId: vi.fn(),
  getEventsByProjectId: vi.fn(),
  getEventsInDateRange: vi.fn(),
  generateEventOccurrences: vi.fn(),
  updateEventAndOccurrences: vi.fn(),
  deleteEventAndOccurrences: vi.fn(),
}));
vi.mock("@/lib/dbService/projects", () => ({
  getProjectById: vi.fn(),
}));
vi.mock("@/lib/dbService/workspace-members", () => ({
  getMemberByUserIdAndWorkspaceId: vi.fn(),
  getMemberWithUserByUserIdAndWorkspaceId: vi.fn(),
}));
vi.mock("@/lib/dbService/task-worklogs", () => ({
  createTaskWorklog: vi.fn(),
  updateTaskWorklog: vi.fn(),
  deleteTaskWorklog: vi.fn(),
  getWorklogById: vi.fn(),
}));
vi.mock("@/lib/s3", () => ({
  uploadToS3: vi.fn(),
  deleteManyFromS3: vi.fn(),
  extractS3KeyFromUrl: vi.fn(),
}));
vi.mock("@/lib/mailing-functions", () => ({
  sendTaskAssignmentNotification: vi.fn(),
}));
vi.mock("@/prisma/prisma", () => ({
  default: {},
}));

describe("DELETE /tasks/children", () => {
  beforeEach(() => {
    tasksMock.archiveTask.mockReset();
  });

  it("archives the child task and returns the parent id", async () => {
    tasksMock.archiveTask.mockResolvedValue({
      id: "child-1",
    });

    const app = (await import("@/features/tasks/server/route")).default;
    const response = await app.request("http://localhost/children", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        childTask: "child-1",
        parentId: "parent-1",
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: "parent-1",
    });
    expect(tasksMock.archiveTask).toHaveBeenCalledWith("child-1");
  });
});
