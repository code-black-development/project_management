"use client";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  cn,
  minutesToTimeEstimateString,
  timeEstimateStringToMinutes,
} from "@/lib/utils";

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

import { ArrowLeftIcon, CopyIcon, Delete, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateTaskWorklog } from "../api/use-create-task-worklog";
import { useUpdateWorklog } from "../api/use-update-worklog";
import { useGetWorklog } from "../api/use-get-worklog";
import { createWorklogSchema } from "../schema";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { useSession } from "next-auth/react";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/date-picker";

interface TaskWorklogFormProps {
  id: string;
  onCancel?: () => void;
  worklogId?: string;
}

const TaskWorklogForm = ({ id, onCancel, worklogId }: TaskWorklogFormProps) => {
  const workspaceId = useWorkspaceId();
  const { data: session } = useSession();

  const { mutate: createWorklog, isPending: isCreating } =
    useCreateTaskWorklog();
  const { mutate: updateWorklog, isPending: isUpdating } = useUpdateWorklog();

  const isEditing = !!worklogId;

  // Fetch worklog data when editing
  const { data: worklogData, isLoading: isLoadingWorklog } = useGetWorklog({
    worklogId: worklogId || "",
  });

  const isPending = isCreating || isUpdating || (isEditing && isLoadingWorklog);

  const form = useForm<z.infer<typeof createWorklogSchema>>({
    resolver: zodResolver(createWorklogSchema),
    defaultValues: {
      timeSpent: "",
      dateWorked: new Date(),
      workDescription: "",
    },
  });

  // Update form values when worklog data is loaded
  React.useEffect(() => {
    if (worklogData && isEditing) {
      form.reset({
        timeSpent: minutesToTimeEstimateString(worklogData.timeSpent),
        dateWorked: new Date(worklogData.dateWorked),
        workDescription: worklogData.workDescription || "",
      });
    }
  }, [worklogData, isEditing, form]);

  const onSubmit = (values: z.infer<typeof createWorklogSchema>) => {
    if (isEditing && worklogId) {
      // Update existing worklog
      updateWorklog(
        {
          param: { worklogId },
          json: {
            timeSpent: timeEstimateStringToMinutes(values.timeSpent),
            dateWorked: values.dateWorked,
            workDescription: values.workDescription || null,
          },
        },
        {
          onSuccess: () => {
            if (onCancel) {
              onCancel();
            }
          },
        }
      );
    } else {
      // Create new worklog
      createWorklog(
        {
          json: {
            ...values,
            timeSpent: timeEstimateStringToMinutes(values.timeSpent),
            workspaceId,
            userId: session?.user?.id!,
            taskId: id,
          },
        },
        {
          onSuccess: () => {
            if (onCancel) {
              onCancel();
            }
          },
        }
      );
    }
  };

  return (
    <div className="flex flex-col gap-y-4">
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader className={cn("flex p-7")}>
          <CardTitle className="text-xl font-bold">
            {isEditing ? "Edit Worklog" : "Create Worklog"}
          </CardTitle>
        </CardHeader>
        <div className="px-7">
          <DottedSeparator />
        </div>
        <CardContent className="p-7">
          <div className="flex items-center gap-x-2 mb-4">
            <MemberAvatar
              className="w-12 h-12"
              name={(session?.user?.name ?? session?.user?.name) || undefined}
              image={session?.user?.image || undefined}
            />
            <p>{session?.user?.name || session?.user?.email}</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="">
              <div className="flex flex-col gap-y-4">
                <FormField
                  name="dateWorked"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          {...field}
                          value={(field.value as Date) ?? undefined}
                          placeholder="Select Due Date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="timeSpent"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time worked</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="e.g., 2h 30m, 1d 4h, 1w 2d 3h 15m"
                          className="input"
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        Use: w (weeks), d (days), h (hours), m (minutes)
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="workDescription"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
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
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending || (isEditing && !worklogData)}
                >
                  {isPending
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Worklog"
                      : "Create Worklog"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskWorklogForm;
