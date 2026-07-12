"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import {
  Form,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Editor } from "@/components/editor";

import { ArrowLeftIcon, RefreshCwIcon, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { TaskStatus } from "@prisma/client";

import { useConfirm } from "@/hooks/use-confirm";
import { createTaskSchema, patchTaskSchema, updateTaskSchema } from "../schema";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useUpdateTask } from "../api/use-update-task";
import { useCreateTask } from "../api/use-create-task";
import { useDeleteTask } from "../api/use-delete-task";
import { useCreateChildTask } from "../hooks/use-create-child-task";
import { useCreateTaskSeries } from "../api/use-create-task-series";
import { useGetTaskCategories } from "../hooks/use-get-task-categories";
import DatePicker from "@/components/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MemberAvatar from "@/features/members/_components/member-avatar";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import DynamicIcon from "@/components/dynamic-icon";
import PastDateWarning from "./past-date-warning";

import type {
  MemberSafeDate,
  ProjectSafeDate,
  TaskWithUser,
  UserSafeDate,
} from "@/types/types";

interface TaskFormProps {
  initialValues?: TaskWithUser;
  onCancel?: () => void;
  projectOptions: ProjectSafeDate[];
  memberOptions: (MemberSafeDate & {
    user: UserSafeDate;
  })[];
  parentTaskInfo?: {
    taskId: string;
    projectId: string;
    workspaceId: string;
  };
}

const UNASSIGNED_VALUE = "unassigned";
const SMALL_TEAM_ASSIGNEE_LIMIT = 10;

const getMemberName = (
  member: MemberSafeDate & {
    user: UserSafeDate;
  }
) => member.user.name || member.user.email || "Unnamed member";

const optionClassName = (isSelected: boolean) =>
  cn(
    "cursor-pointer",
    "flex min-h-11 items-center gap-x-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
    "hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    isSelected
      ? "border-primary bg-primary/10 text-foreground"
      : "border-border bg-background text-muted-foreground"
  );

const compactOptionClassName = (isSelected: boolean) =>
  cn(
    "cursor-pointer",
    "flex min-h-9 items-center gap-x-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
    "hover:bg-accent",
    isSelected
      ? "border-primary bg-primary/10 text-foreground"
      : "border-border bg-background text-muted-foreground"
  );

const TaskForm = ({
  initialValues,
  onCancel,
  projectOptions,
  memberOptions,
  parentTaskInfo,
}: TaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const routeProjectId = useProjectId();
  const activeProjectId =
    parentTaskInfo?.projectId || (!initialValues ? routeProjectId : undefined);
  const shouldShowProjectSelect = Boolean(initialValues) || !activeProjectId;
  const activeProject = projectOptions.find(
    (project) => project.id === activeProjectId
  );

  const { data: categories, isLoading: categoriesLoading } =
    useGetTaskCategories();

  const formSchema = initialValues ? updateTaskSchema : createTaskSchema;

  const router = useRouter();

  const handleFormSuccess = () => {
    form.reset();
    onCancel?.();
  };

  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: createTask, isPending: isCreating } = useCreateTask({
    redirectOnSuccess: false,
  });
  const { mutate: createChildTask, isPending: isCreatingChild } =
    useCreateChildTask();
  const { mutate: createSeries, isPending: isCreatingSeries } = useCreateTaskSeries();

  const isPending = isUpdating || isCreating || isCreatingChild || isCreatingSeries;

  const { mutate: deleteTask } = useDeleteTask();

  const isCreateMode = !initialValues && !parentTaskInfo;
  const [seriesEnabled, setSeriesEnabled] = useState(false);
  const [seriesFrequency, setSeriesFrequency] = useState<"WEEKLY" | "FORTNIGHTLY" | "MONTHLY">("WEEKLY");
  const [seriesEndDate, setSeriesEndDate] = useState<Date | undefined>(undefined);

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Task",
    "This action cannot be undone",
    "destructive"
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workspaceId: parentTaskInfo?.workspaceId || workspaceId,
      name: initialValues?.name ?? "",
      dueDate: initialValues?.dueDate
        ? new Date(initialValues.dueDate)
        : undefined,
      assigneeId: initialValues?.assigneeId ?? "",
      status: initialValues?.status ?? TaskStatus.TODO,
      projectId:
        initialValues?.projectId ?? parentTaskInfo?.projectId ?? activeProjectId ?? "",
      timeEstimate: initialValues?.timeEstimate ?? "",
      categoryId: initialValues?.categoryId ?? "",
      description: initialValues?.description ?? "",
    },
  });

  const taskCategoryId = useMemo(() => {
    return categories?.find(
      (category) => category.name.trim().toLowerCase() === "task"
    )?.id;
  }, [categories]);

  useEffect(() => {
    if (initialValues || !taskCategoryId || form.getValues("categoryId")) {
      return;
    }

    form.setValue("categoryId", taskCategoryId, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [form, initialValues, taskCategoryId]);

  useEffect(() => {
    if (!activeProjectId || form.getValues("projectId")) {
      return;
    }

    form.setValue("projectId", activeProjectId, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [activeProjectId, form]);

  const handleDelete = async () => {
    const deleteStatus = await confirmDelete();
    if (!deleteStatus || !initialValues) {
      return;
    }
    deleteTask({ param: { taskId: initialValues.id } });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (initialValues) {
      const changedFields: z.infer<typeof patchTaskSchema> = {};

      if (values.name !== initialValues.name) {
        changedFields.name = values.name;
      }
      if (values.status !== initialValues.status) {
        changedFields.status = values.status;
      }
      if (values.projectId !== initialValues.projectId) {
        changedFields.projectId = values.projectId;
      }
      if (values.assigneeId !== (initialValues.assigneeId || "")) {
        changedFields.assigneeId = values.assigneeId || null;
      }
      if (values.categoryId !== (initialValues.categoryId || "")) {
        changedFields.categoryId = values.categoryId || null;
      }
      if (values.timeEstimate !== (initialValues.timeEstimate || "")) {
        changedFields.timeEstimate = values.timeEstimate || null;
      }
      if (values.description !== (initialValues.description || "")) {
        changedFields.description = values.description || null;
      }

      const initialDueDate = initialValues.dueDate
        ? new Date(initialValues.dueDate)
        : null;
      const formDueDate =
        values.dueDate instanceof Date
          ? values.dueDate
          : values.dueDate
            ? new Date(values.dueDate)
            : null;

      const datesAreEqual =
        initialDueDate && formDueDate
          ? initialDueDate.getTime() === formDueDate.getTime()
          : initialDueDate === formDueDate;

      if (!datesAreEqual) {
        changedFields.dueDate = formDueDate;
      }

      if (Object.keys(changedFields).length > 0) {
        updateTask(
          {
            json: changedFields,
            param: {
              taskId: initialValues.id,
            },
          },
          {
            onSuccess: handleFormSuccess,
          }
        );
      } else {
        handleFormSuccess();
      }
    } else if (parentTaskInfo) {
      createChildTask(
        {
          parentTaskId: parentTaskInfo.taskId,
          taskData: {
            name: values.name!,
            status: values.status!,
            projectId: values.projectId!,
            workspaceId: parentTaskInfo.workspaceId,
            dueDate:
              values.dueDate instanceof Date
                ? values.dueDate
                : values.dueDate
                  ? new Date(values.dueDate)
                  : null,
            assigneeId: values.assigneeId || null,
            description: values.description || null,
            timeEstimate: values.timeEstimate || null,
            categoryId: values.categoryId || null,
          },
        },
        {
          onSuccess: handleFormSuccess,
        }
      );
    } else {
      createTask(
        {
          json: {
            name: values.name,
            status: values.status,
            projectId: values.projectId,
            workspaceId: values.workspaceId,
            dueDate: values.dueDate || null,
            assigneeId: values.assigneeId || null,
            description: values.description || null,
            timeEstimate: values.timeEstimate || null,
            categoryId: values.categoryId || null,
          },
        },
        {
          onSuccess: ({ data }) => {
            if (seriesEnabled && seriesEndDate) {
              createSeries(
                { taskId: data.id, frequency: seriesFrequency, endDate: seriesEndDate.toISOString() },
                { onSuccess: handleFormSuccess },
              );
            } else {
              handleFormSuccess();
            }
          },
        },
      );
    }
  };

  const action = initialValues
    ? "Update"
    : parentTaskInfo
      ? "Create Child"
      : "Create";

  const title = initialValues
    ? `${action} ${initialValues.name}`
    : parentTaskInfo
      ? `${action} Task`
      : `${action} Task`;

  const useInlineAssigneePicker =
    memberOptions.length <= SMALL_TEAM_ASSIGNEE_LIMIT;

  const categoryOptions = categories ?? [];

  return (
    <div className="flex flex-col gap-y-4">
      <DeleteDialog />
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div
          className={cn(
            "flex items-center justify-between gap-x-4 px-6 py-5 border-b border-border",
            initialValues && "pl-5"
          )}
        >
          <div className="flex min-w-0 items-center gap-x-3">
            {initialValues && (
              <Button
                size="sm"
                variant="muted"
                type="button"
                onClick={
                  onCancel
                    ? onCancel
                    : () =>
                        router.push(
                          `/workspaces/${initialValues.workspaceId}/projects/${initialValues.id}`
                        )
                }
              >
                <ArrowLeftIcon className="size-4" />
                Back
              </Button>
            )}
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground truncate">
                {title}
              </p>
              {!shouldShowProjectSelect && activeProject && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {activeProject.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 flex flex-col gap-y-5">
              <div className="grid min-w-0 gap-5 lg:min-h-[calc(92vh-210px)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-y-4">
                  <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter task name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="min-w-0 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
                        <FormLabel>
                          Description{" "}
                          <span className="text-muted-foreground text-sm">
                            (optional)
                          </span>
                        </FormLabel>
                        <div className="flex min-w-0 max-w-full flex-col overflow-hidden rounded-md border border-input bg-background [&_.ql-container]:min-h-[220px] [&_.ql-editor]:min-h-[220px] lg:flex-1 lg:min-h-0 lg:[&_.ql-container]:min-h-0 lg:[&_.ql-editor]:min-h-0 lg:[&_.quill]:flex lg:[&_.quill]:flex-col lg:[&_.quill]:h-full lg:[&_.ql-toolbar]:shrink-0 lg:[&_.ql-container]:flex-1 lg:[&_.ql-container]:overflow-hidden lg:[&_.ql-editor]:h-full lg:[&_.ql-editor]:overflow-y-auto">
                          <Editor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-y-4">
                  <FormField
                    name="dueDate"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Due date{" "}
                          <span className="text-muted-foreground text-sm">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            {...field}
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
                            placeholder="Select due date"
                            onClear={() => field.onChange(undefined)}
                          />
                        </FormControl>
                        <PastDateWarning
                          date={field.value}
                          message="This due date is in the past. The task will show as overdue."
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="assigneeId"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to</FormLabel>
                        <div className="min-h-[112px]">
                          {useInlineAssigneePicker ? (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                              <div
                                role="button"
                                className={optionClassName(!field.value)}
                                onClick={(e) => { if ((e.target as HTMLElement).tagName === "INPUT") return; field.onChange(""); }}
                              >
                                <Checkbox
                                  checked={!field.value}
                                  onCheckedChange={() => field.onChange("")}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="flex min-w-0 items-center gap-x-2">
                                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <UserRound className="size-3.5" />
                                  </span>
                                  <span className="truncate">Unassigned</span>
                                </span>
                              </div>
                              {memberOptions.map((member) => {
                                const name = getMemberName(member);

                                return (
                                  <div
                                    key={`${member.workspaceId}_${member.userId}`}
                                    role="button"
                                    className={optionClassName(
                                      field.value === member.id
                                    )}
                                    onClick={(e) => { if ((e.target as HTMLElement).tagName === "INPUT") return; field.onChange(member.id); }}
                                  >
                                    <Checkbox
                                      checked={field.value === member.id}
                                      onCheckedChange={() =>
                                        field.onChange(member.id)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="flex min-w-0 items-center gap-x-2">
                                      <MemberAvatar
                                        className="size-6 shrink-0"
                                        name={name}
                                        image={member.user.image || undefined}
                                      />
                                      <span className="truncate">{name}</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <Select
                              value={field.value || UNASSIGNED_VALUE}
                              onValueChange={(value) =>
                                field.onChange(
                                  value === UNASSIGNED_VALUE ? "" : value
                                )
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={UNASSIGNED_VALUE}>
                                  <div className="flex items-center gap-x-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                      <UserRound className="size-3.5" />
                                    </span>
                                    Unassigned
                                  </div>
                                </SelectItem>
                                {memberOptions.map((member) => {
                                  const name = getMemberName(member);

                                  return (
                                    <SelectItem
                                      key={`${member.workspaceId}_${member.userId}`}
                                      value={member.id}
                                    >
                                      <div className="flex items-center gap-x-2">
                                        <MemberAvatar
                                          className="size-6"
                                          name={name}
                                          image={
                                            member.user.image || undefined
                                          }
                                        />
                                        {name}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {shouldShowProjectSelect && (
                    <FormField
                      name="projectId"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projectOptions.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  <div className="flex items-center gap-x-2">
                                    <ProjectAvatar
                                      className="size-6"
                                      name={project.name}
                                      image={project.image ?? undefined}
                                    />
                                    {project.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    name="categoryId"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <div className="grid min-h-9 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                          {categoriesLoading ? (
                            <div className="flex min-h-9 items-center rounded-md border border-border px-2.5 text-xs text-muted-foreground">
                              Loading categories
                            </div>
                          ) : (
                            <>
                              {initialValues && (
                                <div
                                  role="button"
                                  className={compactOptionClassName(
                                    !field.value
                                  )}
                                  onClick={(e) => { if ((e.target as HTMLElement).tagName === "INPUT") return; field.onChange(""); }}
                                >
                                  <Checkbox
                                    checked={!field.value}
                                    onCheckedChange={() => field.onChange("")}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="truncate">No category</span>
                                </div>
                              )}
                              {categoryOptions.map((category) => (
                                <div
                                  key={category.id}
                                  role="button"
                                  className={compactOptionClassName(
                                    field.value === category.id
                                  )}
                                  onClick={(e) => { if ((e.target as HTMLElement).tagName === "INPUT") return; field.onChange(category.id); }}
                                >
                                  <Checkbox
                                    checked={field.value === category.id}
                                    onCheckedChange={() =>
                                      field.onChange(category.id)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="flex min-w-0 items-center gap-x-1.5">
                                    <DynamicIcon
                                      iconName={category.icon || "tag"}
                                      className="size-3.5 shrink-0"
                                    />
                                    <span className="truncate">
                                      {category.name}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={TaskStatus.BACKLOG}>
                              Backlog
                            </SelectItem>
                            <SelectItem value={TaskStatus.TODO}>
                              To do
                            </SelectItem>
                            <SelectItem value={TaskStatus.IN_PROGRESS}>
                              In progress
                            </SelectItem>
                            <SelectItem value={TaskStatus.IN_REVIEW}>
                              In review
                            </SelectItem>
                            <SelectItem value={TaskStatus.DONE}>
                              Done
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="timeEstimate"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Time estimate{" "}
                          <span className="text-muted-foreground text-sm">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="text"
                            placeholder="2w 3d 4h 30m"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isCreateMode && (
                    <div className="flex flex-col gap-y-3 border-t border-border pt-4">
                      <div
                        role="button"
                        className={cn(
                          "flex items-center gap-x-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors cursor-pointer",
                          seriesEnabled
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-accent"
                        )}
                        onClick={() => setSeriesEnabled((v) => !v)}
                      >
                        <Checkbox
                          checked={seriesEnabled}
                          onCheckedChange={(checked) => setSeriesEnabled(Boolean(checked))}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <RefreshCwIcon className="size-3.5 shrink-0" />
                        <span>Repeat this task</span>
                      </div>

                      {seriesEnabled && (
                        <div className="flex flex-col gap-y-3 pl-1">
                          <div className="flex flex-col gap-y-1.5">
                            <p className="text-xs text-muted-foreground">Frequency</p>
                            <Select
                              value={seriesFrequency}
                              onValueChange={(v) => setSeriesFrequency(v as typeof seriesFrequency)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="FORTNIGHTLY">Fortnightly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col gap-y-1.5">
                            <p className="text-xs text-muted-foreground">
                              End date <span className="text-destructive">*</span>
                            </p>
                            <DatePicker
                              value={seriesEndDate}
                              onChange={setSeriesEndDate}
                              placeholder="Pick an end date"
                            />
                            {!seriesEndDate && (
                              <p className="text-xs text-destructive">Required for repeated tasks</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-x-3">
              <Button
                type="button"
                variant="muted"
                disabled={isPending}
                onClick={onCancel}
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || (seriesEnabled && !seriesEndDate)}>
                {action} Task
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {initialValues && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground">Danger Zone</p>
          <p className="text-sm text-muted-foreground mt-1">
            Deleting a task is irreversible and will remove all associated data.
          </p>
          <Button
            className="mt-4"
            size="sm"
            variant="destructive"
            type="button"
            disabled={isPending}
            onClick={handleDelete}
          >
            Delete Task
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskForm;
