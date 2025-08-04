"use client";
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
import MemberAvatar from "@/features/members/_components/member-avatar";
import { useSession } from "next-auth/react";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/date-picker";
import { time } from "console";

interface TaskWorklogFormProps {
  id: string;
  onCancel?: () => void;
}

const TaskWorklogForm = ({ id, onCancel }: TaskWorklogFormProps) => {
  const workspaceId = useWorkspaceId();
  const { data: session } = useSession();

  const formSchema = z.object({
    timeSpent: z.string().nonempty("time is required"),
    dateWorked: z.date(),
    workDescription: z.string().optional(),
  });

  const { mutate, isPending } = useCreateTaskWorklog();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeSpent: "",
      dateWorked: new Date(),
      workDescription: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(
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
          // Close the modal after successful worklog creation
          if (onCancel) {
            onCancel();
          }
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-y-4">
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader className={cn("flex p-7")}>
          <CardTitle className="text-xl font-bold">Create Worklog</CardTitle>
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
                          placeholder="6w 3d 4h 2m"
                          className="input"
                        />
                      </FormControl>
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
                <Button type="submit" size="lg" disabled={isPending}>
                  Create Worklog
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
