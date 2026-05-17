"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "@/features/workspaces/schemas";

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
import Image from "next/image";
import { ArrowLeftIcon, ImageIcon } from "lucide-react";
import { useCreateWorkspace } from "@/features/workspaces/api/use-create-workspace";
import { useRouter } from "next/navigation";
import { useUpdateWorkspace } from "../api/use-update-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { useDeleteWorkspace } from "../api/use-delete-workspace";
import { WorkspaceSafeDates } from "@/types/types";
import WorkspaceInviteForm from "./workspace-invites-form";

interface WorkspaceFormProps {
  initialValues?: Partial<WorkspaceSafeDates>;
  onCancel?: () => void;
}

const WorkspaceForm = ({ initialValues, onCancel }: WorkspaceFormProps) => {
  const formSchema = initialValues
    ? updateWorkspaceSchema
    : createWorkspaceSchema;
  const router = useRouter();

  const { mutate, isPending } = initialValues
    ? useUpdateWorkspace()
    : useCreateWorkspace();

  const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } =
    useDeleteWorkspace();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Workspace",
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
    if (!deleteStatus) return;
    deleteWorkspace(
      { param: { workspaceId: initialValues?.id! } },
      {
        onSuccess: () => {
          router.push("/");
        },
      }
    );
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formValues = {
      ...values,
      image: values.image instanceof File || values.image ? values.image : "",
    };

    if (initialValues) {
      mutate({ form: formValues, param: { workspaceId: initialValues.id! } });
    } else {
      mutate(
        // @ts-ignore param is only required if we are editing a workspace
        { form: formValues },
        {
          onSuccess: ({ data }) => {
            form.reset();
            router.push(`/workspaces/${data?.id}`);
          },
        }
      );
    }
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
                  : () => router.push(`/workspaces/${initialValues.id}`)
              }
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
          )}
          <p className="text-base font-semibold text-foreground">
            {initialValues
              ? `Update ${initialValues.name}`
              : "Create Workspace"}
          </p>
        </div>

        {/* Body */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 flex flex-col gap-y-5">
              {/* Workspace name */}
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Workspace Name"
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
                          alt="Workspace icon"
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
                        Workspace icon{" "}
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
                {action} Workspace
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Invite section (edit mode only) */}
      {initialValues && <WorkspaceInviteForm />}

      {/* Danger Zone (edit mode only) */}
      {initialValues && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground">Danger Zone</p>
          <p className="text-sm text-muted-foreground mt-1">
            Deleting a workspace is irreversible and will remove all associated
            data.
          </p>
          <Button
            className="mt-4"
            size="sm"
            variant="destructive"
            type="button"
            disabled={isDeletingWorkspace || isPending}
            onClick={handleDelete}
          >
            Delete Workspace
          </Button>
        </div>
      )}
    </div>
  );
};

export default WorkspaceForm;
