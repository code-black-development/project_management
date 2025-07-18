"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { z } from "zod";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormMessage,
  FormControl,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import DottedSeparator from "@/components/dotted-separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ArrowLeftIcon, Delete, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { TaskStatus } from "@prisma/client";

import { useConfirm } from "@/hooks/use-confirm";

import { createTaskSchema, updateTaskSchema } from "../schema";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useUpdateTask } from "../api/use-update-task";
import { useCreateTask } from "../api/use-create-task";
import { useDeleteTask } from "../api/use-delete-task";
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
}

const TaskForm = ({
  initialValues,
  onCancel,
  projectOptions,
  memberOptions,
}: TaskFormProps) => {
  const workspaceId = useWorkspaceId();
  console.log("users: ", memberOptions);

  const { data: categories, isLoading: categoriesLoading } =
    useGetTaskCategories();

  const formSchema = initialValues ? updateTaskSchema : createTaskSchema;

  const router = useRouter();

  const { mutate, isPending } = initialValues
    ? useUpdateTask()
    : useCreateTask();

  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Task",
    "This action cannot be undone",
    "destructive"
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workspaceId,
      name: initialValues?.name ?? "",
      dueDate: initialValues?.dueDate
        ? new Date(initialValues.dueDate)
        : undefined,
      assigneeId: initialValues?.assigneeId ?? "",
      status: initialValues?.status ?? TaskStatus.TODO,
      projectId: initialValues?.projectId ?? "",
      timeEstimate: initialValues?.timeEstimate ?? "",
      categoryId: initialValues?.categoryId ?? "",
    },
  });

  const handleDelete = async () => {
    const deleteStatus = await confirmDelete();
    if (!deleteStatus) {
      return;
    }
    deleteTask({ param: { taskId: initialValues?.id! } });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("values: ", values);
    let payload;
    if (initialValues) {
      payload = {
        json: {
          ...values,
        },
        param: {
          taskId: initialValues.id,
        },
      };
    } else {
      payload = {
        json: {
          ...values,
          workspaceId,
        },
      };
    }
    mutate(
      //@ts-ignore
      payload,

      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      }
    );
  };

  const action = initialValues ? "Update" : "Create";

  return (
    <div className="flex flex-col gap-y-4">
      <DeleteDialog />
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader
          className={cn(
            "flex p-7",
            initialValues && "flex-row items-center gap-x-4 space-y-0"
          )}
        >
          {initialValues && (
            <Button
              size="sm"
              className=""
              variant="secondary"
              onClick={
                onCancel
                  ? onCancel
                  : () =>
                      router.push(
                        `/workspaces/${initialValues.workspaceId}/projects/${initialValues.id}`
                      )
              }
            >
              Back
              <ArrowLeftIcon className="size-4 mr-2" />
            </Button>
          )}
          {!initialValues ? (
            <CardTitle className="text-xl font-bold">{action} Task</CardTitle>
          ) : (
            <CardTitle className="text-xl font-bold">
              {`${action} ${initialValues.name}`}
            </CardTitle>
          )}
        </CardHeader>
        <div className="px-7">
          <DottedSeparator />
        </div>
        <CardContent className="p-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="">
              <div className="flex flex-col gap-y-4">
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter task Name"
                          className="input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="dueDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Due Date{" "}
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
                          placeholder="Select Due Date (optional)"
                        />
                      </FormControl>
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
                      <Select
                        defaultValue={field.value ?? undefined}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Assignee"></SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <FormMessage />
                        <SelectContent>
                          {memberOptions.map((member) => (
                            <SelectItem
                              key={`${member.workspaceId}_${member.userId}`}
                              value={member.id}
                            >
                              <div className="flex items-center gap-x-2">
                                <MemberAvatar
                                  className="size-6"
                                  name={member.user.name ?? member.user.email!}
                                />
                                {member.user.name || member.user.email!}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status"></SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <FormMessage />
                        <SelectContent>
                          <SelectItem value={TaskStatus.BACKLOG}>
                            backlog
                          </SelectItem>
                          <SelectItem value={TaskStatus.TODO}>todo</SelectItem>
                          <SelectItem value={TaskStatus.IN_PROGRESS}>
                            in progress
                          </SelectItem>
                          <SelectItem value={TaskStatus.IN_REVIEW}>
                            in review
                          </SelectItem>
                          <SelectItem value={TaskStatus.DONE}>done</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="projectId"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project"></SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <FormMessage />
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
                    </FormItem>
                  )}
                />
                <FormField
                  name="categoryId"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        defaultValue={field.value ?? undefined}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category"></SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <FormMessage />
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-x-2">
                                <DynamicIcon
                                  iconName={category.icon || "tag"}
                                  className="size-4"
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="timeEstimate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Time Estimate{" "}
                        <span className="text-muted-foreground text-sm">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="text"
                          placeholder="2w 3d 4h 3m (optional)"
                          className="input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DottedSeparator className="py-7" />
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  disabled={isPending}
                  onClick={onCancel}
                  className={cn(!onCancel && "invisible")}
                >
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={isPending}>
                  {action} Task
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {initialValues && (
        <div className="flex flex-col gap-y-4">
          <DeleteDialog />
          <Card className="w-full h-full border-none shadow-none">
            <CardContent className="p-7">
              <div className="flex flex-col">
                <h3 className="font-bold">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Deleting a Task is irreversible and will remove all asociated
                  data.
                </p>
                <Button
                  className="mt-6 w-fit ml-auto"
                  size="sm"
                  variant="destructive"
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  Delete Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TaskForm;
