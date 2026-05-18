"use client";
import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Editor } from "@/components/editor";

import { UserRound } from "lucide-react";
import {
  TaskStatus,
  TaskType,
  RecurrenceFrequency,
  RecurrenceDuration,
} from "@prisma/client";

import { createEventSchema } from "../schema";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useCreateEvent } from "../api/use-create-event";

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

const UNASSIGNED_VALUE = "unassigned";
const SMALL_TEAM_ASSIGNEE_LIMIT = 10;

const getMemberName = (
  member: MemberSafeDate & { user: UserSafeDate }
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

const EventForm = ({
  onCancel,
  projectOptions,
  memberOptions,
}: EventFormProps) => {
  const workspaceId = useWorkspaceId();
  const routeProjectId = useProjectId();
  const activeProjectId = routeProjectId ?? undefined;
  const shouldShowProjectSelect = !activeProjectId;
  const activeProject = projectOptions.find((p) => p.id === activeProjectId);

  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();

  const form = useForm<z.infer<typeof createEventSchema>>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      status: TaskStatus.TODO,
      workspaceId,
      projectId: activeProjectId ?? "",
      taskType: TaskType.EVENT,
      categoryId: undefined,
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

  useEffect(() => {
    if (!activeProjectId || form.getValues("projectId")) return;
    form.setValue("projectId", activeProjectId, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [activeProjectId, form]);

  const watchedIsRecurring = form.watch("isRecurring");
  const watchedRecurrenceDuration = form.watch("recurrenceDuration");

  const useInlineAssigneePicker = memberOptions.length <= SMALL_TEAM_ASSIGNEE_LIMIT;

  const onSubmit = (values: z.infer<typeof createEventSchema>) => {
    createEvent(
      { json: values },
      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-x-4 px-6 py-5 border-b border-border">
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">Create New Event</p>
            {!shouldShowProjectSelect && activeProject && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {activeProject.name}
              </p>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 flex flex-col gap-y-5">
              <div className="grid gap-5 lg:min-h-[calc(92vh-210px)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">

                {/* Left column: name + description */}
                <div className="flex min-h-0 flex-col gap-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event name</FormLabel>
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
                      <FormItem className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
                        <FormLabel>
                          Description{" "}
                          <span className="text-muted-foreground text-sm">(optional)</span>
                        </FormLabel>
                        <div className="overflow-hidden rounded-md border border-input bg-background lg:flex-1 lg:min-h-[380px] [&_.ql-container]:min-h-[300px] [&_.ql-editor]:min-h-[300px] lg:[&_.quill]:flex lg:[&_.quill]:h-full lg:[&_.quill]:flex-col lg:[&_.ql-container]:min-h-0 lg:[&_.ql-container]:flex-1 lg:[&_.ql-editor]:min-h-0">
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

                {/* Right column: all other fields */}
                <div className="flex flex-col gap-y-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Date{" "}
                          <span className="text-muted-foreground text-sm">(optional)</span>
                        </FormLabel>
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
                        <FormLabel>Assign to</FormLabel>
                        <div className="min-h-[112px]">
                          {useInlineAssigneePicker ? (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                              <div
                                role="button"
                                className={optionClassName(!field.value)}
                                onClick={() => field.onChange("")}
                              >
                                <Checkbox
                                  checked={!field.value}
                                  onCheckedChange={() => field.onChange("")}
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
                                    className={optionClassName(field.value === member.id)}
                                    onClick={() => field.onChange(member.id)}
                                  >
                                    <Checkbox
                                      checked={field.value === member.id}
                                      onCheckedChange={() => field.onChange(member.id)}
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
                                field.onChange(value === UNASSIGNED_VALUE ? "" : value)
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
                                          image={member.user.image || undefined}
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
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
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
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                            <SelectItem value={TaskStatus.TODO}>To do</SelectItem>
                            <SelectItem value={TaskStatus.IN_PROGRESS}>In progress</SelectItem>
                            <SelectItem value={TaskStatus.IN_REVIEW}>In review</SelectItem>
                            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
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
                        <FormLabel>
                          Time estimate{" "}
                          <span className="text-muted-foreground text-sm">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="2w 3d 4h 30m"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Recurrence */}
                  <div className="border border-border rounded-lg p-4 space-y-4">
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
                              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={RecurrenceFrequency.DAILY}>Every day</SelectItem>
                                  <SelectItem value={RecurrenceFrequency.WEEKLY}>Weekly</SelectItem>
                                  <SelectItem value={RecurrenceFrequency.MONTHLY}>Monthly</SelectItem>
                                  <SelectItem value={RecurrenceFrequency.ANNUALLY}>Annually</SelectItem>
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
                              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={RecurrenceDuration.ONE_MONTH}>One month</SelectItem>
                                  <SelectItem value={RecurrenceDuration.ONE_YEAR}>One year</SelectItem>
                                  <SelectItem value={RecurrenceDuration.CUSTOM}>Custom date</SelectItem>
                                  <SelectItem value={RecurrenceDuration.CONTINUOUS}>Continuously</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchedRecurrenceDuration === RecurrenceDuration.CUSTOM && (
                          <FormField
                            control={form.control}
                            name="recurrenceEndDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End date</FormLabel>
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
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-x-3">
              <Button
                type="button"
                variant="muted"
                disabled={isCreating}
                onClick={onCancel}
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button disabled={isCreating} type="submit">
                Create Event
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EventForm;
