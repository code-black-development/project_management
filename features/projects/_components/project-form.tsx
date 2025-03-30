"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { ArrowLeftIcon, CopyIcon, Delete, ImageIcon } from "lucide-react";
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
    : createProjectSchema.omit({ workspaceId: true });

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
    },
  });

  const { isDirty } = form.formState;

  const handleDelete = async () => {
    const deleteStatus = await confirmDelete();
    if (!deleteStatus) {
      return;
    }
    deleteProject({ param: { projectId: initialValues?.id! } });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formValues = {
      ...values,
      ...(!initialValues && { workspaceId }),
      image: values.image instanceof File || values.image ? values.image : "",
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
            <CardTitle className="text-xl font-bold">
              {action} Project
            </CardTitle>
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
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Project Name"
                          className="input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="image"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-y-2">
                      <div className="flex items-center gap-x-5">
                        {field.value ? (
                          <div className="size-[72px] relative rounded-md overflow-hidden">
                            <Image
                              src={
                                field.value instanceof File
                                  ? URL.createObjectURL(field.value)
                                  : `/${field.value}`
                              }
                              alt="Logo"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <Avatar className="size-[72px]">
                            <AvatarFallback>
                              <ImageIcon className="size-[36px] text-neutral-400" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col">
                          <p className="text-sm">Project Icon</p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG, SVG or JPEG. Max 1mb.
                          </p>
                          <input
                            className="hidden "
                            type="file"
                            accept=".jpg, .png, .jpeg, .svg"
                            ref={inputRef}
                            disabled={isPending}
                            onChange={handleImageChange}
                          />
                          {field.value ? (
                            <Button
                              type="button"
                              disabled={isPending}
                              variant="destructive"
                              size="xs"
                              className="w-fit mt-2"
                              onClick={() => {
                                field.onChange("");
                                if (inputRef.current) {
                                  inputRef.current.value = "";
                                }
                              }}
                            >
                              Remove Image
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              disabled={isPending}
                              variant="tertiary"
                              size="xs"
                              className="w-fit mt-2"
                              onClick={() => inputRef.current?.click()}
                            >
                              Upload Image
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
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
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending || !isDirty}
                >
                  {action} Project
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
                  Deleting a project is irreversible and will remove all
                  asociated data.
                </p>
                <Button
                  className="mt-6 w-fit ml-auto"
                  size="sm"
                  variant="destructive"
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectForm;
