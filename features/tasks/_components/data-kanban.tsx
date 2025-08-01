import { Task, TaskStatus } from "@prisma/client";

import React, { useEffect, useCallback, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";

import DataKanbanColumnHeader from "./data-kanban-column-header";
import DataKanbanCard from "./data-kanban-card";
import { TaskWithUser } from "@/types/types";

const boards: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

type TasksState = {
  [key in TaskStatus]: Omit<TaskWithUser, "children">[];
};

interface DataKanbanProps {
  data: Omit<TaskWithUser, "children">[];
  onChange: (
    tasks: { id: string; position: number; status: TaskStatus }[]
  ) => void;
}

const DataKanban = ({ data, onChange }: DataKanbanProps) => {
  const [tasks, setTasks] = useState<TasksState>(() => {
    const initialTasks: TasksState = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
    };

    data.forEach((task) => {
      initialTasks[task.status].push(task);
    });

    Object.keys(initialTasks).forEach((status) => {
      initialTasks[status as TaskStatus].sort(
        (a, b) => a.position - b.position
      );
    });
    return initialTasks;
  });

  useEffect(() => {
    const newTasks: TasksState = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
    };
    data.forEach((task) => {
      newTasks[task.status].push(task);
    });

    Object.keys(newTasks).forEach((status) => {
      newTasks[status as TaskStatus].sort((a, b) => a.position - b.position);
    });
    setTasks(newTasks);
  }, [data]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { source, destination } = result;
      const sourceStatus = source.droppableId as TaskStatus;
      const destStatus = destination.droppableId as TaskStatus;
      let updatesPayload: {
        id: string;
        position: number;
        status: TaskStatus;
      }[] = [];

      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };
        //remove task from source column
        const sourceColumn = [...newTasks[sourceStatus]];
        const [movedTask] = sourceColumn.splice(source.index, 1);

        if (!movedTask) {
          console.log("No task at source index");
          return prevTasks;
        }
        //are we changing position within a status or moving it into a new status
        const updatedMovedTask =
          sourceStatus !== destStatus
            ? { ...movedTask, status: destStatus }
            : movedTask;

        newTasks[sourceStatus] = sourceColumn;

        const destColumn = [...newTasks[destStatus]];

        destColumn.splice(destination.index, 0, updatedMovedTask);

        newTasks[destStatus] = destColumn;

        updatesPayload = [];
        //always update the moved task
        updatesPayload.push({
          id: updatedMovedTask.id,
          status: destStatus,
          position: destination.index + 1,
        });

        //update the rest of the tasks in the destination column
        newTasks[destStatus].forEach((task, index) => {
          if (task && task.id !== updatedMovedTask.id) {
            const newPosition = index + 1;
            if (task.position !== newPosition) {
              updatesPayload.push({
                id: task.id,
                position: newPosition,
                status: destStatus,
              });
            }
          }
        });
        //update the rest of the tasks in the source column
        if (sourceStatus !== destStatus) {
          newTasks[sourceStatus].forEach((task, index) => {
            if (task) {
              const newPostion = index + 1;
              if (task.position !== newPostion) {
                updatesPayload.push({
                  id: task.id,
                  position: newPostion,
                  status: sourceStatus,
                });
              }
            }
          });
        }
        return newTasks;
      });
      onChange(updatesPayload);
    },
    [onChange]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto">
        {boards.map((board) => {
          return (
            <div
              key={board}
              className="flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[200px]"
            >
              <DataKanbanColumnHeader
                board={board}
                taskCount={tasks[board].length}
              />
              <Droppable droppableId={board}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[200px] py-1.5"
                  >
                    {tasks[board].map((task, index) => {
                      return (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-primary-foreground rounded-md p-2 mb-2"
                            >
                              <DataKanbanCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default DataKanban;
