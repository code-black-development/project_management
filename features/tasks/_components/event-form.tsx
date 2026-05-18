"use client";
import React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/date-picker";
import MemberAvatar from "@/features/members/_components/member-avatar";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import DynamicIcon from "@/components/dynamic-icon";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  TaskStatus,
  TaskType,
  RecurrenceFrequency,
  RecurrenceDuration,
} from "@prisma/client";

import { createEventSchema } from "../schema";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateEvent } from "../api/use-create-event";
import { useGetTaskCategories } from "../hooks/use-get-task-categories";

import type {
  MemberSafeDate,
  ProjectSafeDate,
  UserSafeDate,
} from "@/types/types";

interface EventFormProps {
  onCancel?: () => void;
  projectOptions: ProjectSafeDate[];
  memberOptions: (MemberSafeDate & {
    user: UserSafeDate;
  })[];
}

const EventForm = ({
  onCancel,
  projectOptions,
  memberOptions,
}: EventFormProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const { data: categories, isLoading: categoriesLoading } =
    useGetTaskCategories();

  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();

  const form = useForm<z.infer<typeof createEventSchema>>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      status: TaskStatus.TODO,
      workspaceId,
      projectId: "",
      taskType: TaskType.EVENT,
      categoryId: "",
      timeEstimate: "",
      dueDate: undefined,
      assigneeId: "",
      description: "",
      isRecurring: false,
      recurrenceFrequency: undefined,
      recurrenceDuration: undefined,
      recurrenceEndDate: undefined,
    },
  });

  const watchedIsRecurring = form.watch("isRecurring");
  const watchedRecurrenceDuration = form.watch("recurrenceDuration");

  const onSubmit = (values: z.infer<typeof createEventSchema>) => {
    createEvent(
      { json: values },
      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      }
    );
  };

  const formattedProjectOptions = projectOptions.map((project) => ({
    id: project.id,
    name: project.name,
    image: project.image,
  }));

  const formattedMemberOptions = memberOptions.map((member) => ({
    id: member.id,
    name: member.user.name || member.user.email,
    image: member.user.image,
  }));

  const formattedCategoryOptions = categories?.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
  }));

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Create New Event</CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter event name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter event description"
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formattedProjectOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-x-2">
                              <ProjectAvatar
                                className="size-6"
                                name={option.name}
                                image={option.image || undefined}
                              />
                              {option.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select
                      defaultValue={field.value ?? "unassigned"}
                      onValueChange={(value) =>
                        field.onChange(value === "unassigned" ? "" : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <div className="flex items-center gap-x-2">
                            <div className="size-6 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                              <span className="text-xs">?</span>
                            </div>
                            Unassigned
                          </div>
                        </SelectItem>
                        {formattedMemberOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-x-2">
                              <MemberAvatar
                                className="size-6"
                                name={option.name}
                                image={option.image || undefined}
                              />
                              {option.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      defaultValue={field.value}
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
                        <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>
                          In Progress
                        </SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>
                          In Review
                        </SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      defaultValue={field.value ?? "no-category"}
                      onValueChange={(value) =>
                        field.onChange(value === "no-category" ? "" : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-category">
                          <div className="flex items-center gap-x-2">
                            <span className="text-sm">No category</span>
                          </div>
                        </SelectItem>
                        {formattedCategoryOptions?.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-x-2">
                              {option.icon && (
                                <DynamicIcon
                                  iconName={option.icon}
                                  className="size-4"
                                />
                              )}
                              {option.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeEstimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Estimate</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="e.g., 2h 30m, 1d, 1w 2d"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurrence Section */}
              <div className="border rounded-lg p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Make this event recurring</FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedIsRecurring && (
                  <>
                    <FormField
                      control={form.control}
                      name="recurrenceFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={RecurrenceFrequency.DAILY}>
                                Every Day
                              </SelectItem>
                              <SelectItem value={RecurrenceFrequency.WEEKLY}>
                                Weekly
                              </SelectItem>
                              <SelectItem value={RecurrenceFrequency.MONTHLY}>
                                Monthly
                              </SelectItem>
                              <SelectItem value={RecurrenceFrequency.ANNUALLY}>
                                Annually
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurrenceDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={RecurrenceDuration.ONE_MONTH}>
                                One Month
                              </SelectItem>
                              <SelectItem value={RecurrenceDuration.ONE_YEAR}>
                                One Year
                              </SelectItem>
                              <SelectItem value={RecurrenceDuration.CUSTOM}>
                                Custom Date
                              </SelectItem>
                              <SelectItem value={RecurrenceDuration.CONTINUOUS}>
                                Continuously
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedRecurrenceDuration ===
                      RecurrenceDuration.CUSTOM && (
                      <FormField
                        control={form.control}
                        name="recurrenceEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            <DottedSeparator className="py-7" />
            <div className="flex items-center justify-between">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                disabled={isCreating}
                className={cn(!onCancel && "invisible")}
              >
                <ArrowLeftIcon className="size-4 mr-2" />
                Cancel
              </Button>
              <Button disabled={isCreating} type="submit" size="lg">
                Create Event
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EventForm;
