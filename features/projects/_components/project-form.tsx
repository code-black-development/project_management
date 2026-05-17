"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";

import {
  Form,
  FormField,
  FormMessage,
  FormControl,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { ArrowLeftIcon, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/hooks/use-confirm";

import { createProjectSchema, updateProjectSchema } from "../schema";
import { useCreateProject } from "../api/use-create-project";
import { useUpdateProject } from "../api/use-update-project";
import { useDeleteProject } from "../api/use-delete-project";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { ProjectSafeDate } from "@/types/types";

interface ProjectFormProps {
  initialValues?: Partial<ProjectSafeDate>;
  onCancel?: () => void;
}

const ProjectForm = ({ initialValues, onCancel }: ProjectFormProps) => {
  const workspaceId = useWorkspaceId();

  const formSchema = initialValues
    ? updateProjectSchema
    : z.object({
        name: z.string().trim().nonempty("Name is required"),
        image: z
          .union([
            z.instanceof(File),
            z.string().transform((val) => (val === "" ? undefined : val)),
          ])
          .optional(),
        autoHideCompletedTasks: z.boolean().optional(),
        autoHideChildTasks: z.boolean().optional(),
        taskAssignmentEmail: z.boolean().optional(),
      });

  const router = useRouter();

  const { mutate, isPending } = initialValues
    ? useUpdateProject()
    : useCreateProject();

  const { mutate: deleteProject, isPending: isDeletingProject } =
    useDeleteProject();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Project",
    "This action cannot be undone",
    "destructive"
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      image: initialValues?.image || undefined,
      autoHideCompletedTasks: initialValues?.autoHideCompletedTasks || false,
      autoHideChildTasks: initialValues?.autoHideChildTasks ?? false,
      taskAssignmentEmail: initialValues?.taskAssignmentEmail ?? true,
    },
  });

  const { isDirty } = form.formState;

  const handleDelete = async () => {
    const deleteStatus = await confirmDelete();
    if (!deleteStatus) return;
    deleteProject({ param: { projectId: initialValues?.id! } });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formValues = {
      ...values,
      ...(!initialValues && { workspaceId }),
      image: values.image instanceof File || values.image ? values.image : "",
      autoHideCompletedTasks: values.autoHideCompletedTasks?.toString(),
      autoHideChildTasks: values.autoHideChildTasks?.toString(),
      taskAssignmentEmail: values.taskAssignmentEmail?.toString(),
    };

    mutate({
      //@ts-ignore ts is not picking up that the param is only in the type if we have initialValues
      form: formValues,
      ...(initialValues && { param: { projectId: initialValues.id! } }),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file, { shouldDirty: true });
    }
  };

  const action = initialValues ? "Update" : "Create";

  return (
    <div className="flex flex-col gap-y-4">
      <DeleteDialog />

      {/* Main form card */}
      <div className="bg-card border border-border rounded-xl">
        {/* Header */}
        <div
          className={cn(
            "flex items-center px-6 py-5 border-b border-border",
            initialValues ? "gap-x-3" : ""
          )}
        >
          {initialValues && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 shrink-0"
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
            </Button>
          )}
          <p className="text-base font-semibold text-foreground">
            {initialValues ? `Update ${initialValues.name}` : "Create Project"}
          </p>
        </div>

        {/* Body */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 flex flex-col gap-y-5">
              {/* Project name */}
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Project Name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Icon upload */}
              <FormField
                name="image"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center gap-x-4">
                    {field.value ? (
                      <div className="size-12 relative rounded-lg overflow-hidden shrink-0 border border-border">
                        <Image
                          src={
                            field.value instanceof File
                              ? URL.createObjectURL(field.value)
                              : `/${field.value}`
                          }
                          alt="Project icon"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-12 shrink-0 flex items-center justify-center rounded-lg bg-muted border border-border">
                        <ImageIcon className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col gap-y-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Project icon{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, SVG or JPEG · Max 1 MB
                      </p>
                      <input
                        className="hidden"
                        type="file"
                        accept=".jpg,.png,.jpeg,.svg"
                        ref={inputRef}
                        disabled={isPending}
                        onChange={handleImageChange}
                      />
                      {field.value ? (
                        <Button
                          type="button"
                          disabled={isPending}
                          variant="muted"
                          size="xs"
                          className="w-fit"
                          onClick={() => {
                            field.onChange("");
                            if (inputRef.current) inputRef.current.value = "";
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={isPending}
                          variant="muted"
                          size="xs"
                          className="w-fit"
                          onClick={() => inputRef.current?.click()}
                        >
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              />

              {/* View settings */}
              <div className="border-t border-border pt-4 flex flex-col gap-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  View settings
                </p>

                <FormField
                  name="autoHideCompletedTasks"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="flex flex-col gap-y-0.5">
                        <FormLabel className="text-sm font-medium leading-none">
                          Auto-hide completed tasks
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Hide tasks with "Done" status from table, kanban, and
                          calendar views
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  name="autoHideChildTasks"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="flex flex-col gap-y-0.5">
                        <FormLabel className="text-sm font-medium leading-none">
                          Auto-hide child tasks
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Hide tasks that are children of other tasks from
                          table, kanban, and calendar views
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Notifications */}
              <div className="border-t border-border pt-4 flex flex-col gap-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notifications
                </p>

                <FormField
                  name="taskAssignmentEmail"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="flex flex-col gap-y-0.5">
                        <FormLabel className="text-sm font-medium leading-none">
                          Task assignment email
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Send email notifications when tasks are assigned to
                          team members
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="muted"
                disabled={isPending}
                onClick={onCancel}
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !isDirty}>
                {action} Project
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Danger Zone (edit mode only) */}
      {initialValues && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground">Danger Zone</p>
          <p className="text-sm text-muted-foreground mt-1">
            Deleting a project is irreversible and will remove all associated
            data.
          </p>
          <Button
            className="mt-4"
            size="sm"
            variant="destructive"
            type="button"
            disabled={isDeletingProject || isPending}
            onClick={handleDelete}
          >
            Delete Project
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectForm;
