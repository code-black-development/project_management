"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  Updater,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useUrlQuerySetter } from "@/hooks/use-url-query-state";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDeleteSelected?: (ids: string[]) => void;
  onUpdateStatusSelected?: (ids: string[], status: TaskStatus) => void;
}

type SelectableRow = {
  id: string;
};

const PAGE_SIZE_STORAGE_KEY = "task-table-page-size";
const PAGE_SIZE_OPTIONS = [15, 30, 50, 100];
const DEFAULT_PAGE_SIZE = 30;
const SORT_COLUMN_PARAM = "task-sort";
const SORT_DIRECTION_PARAM = "task-order";

const getInitialPageSize = () => {
  if (typeof window === "undefined") return DEFAULT_PAGE_SIZE;

  const storedPageSize = Number(
    window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY),
  );

  return PAGE_SIZE_OPTIONS.includes(storedPageSize)
    ? storedPageSize
    : DEFAULT_PAGE_SIZE;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteSelected,
  onUpdateStatusSelected,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: 0,
    pageSize: getInitialPageSize(),
  }));
  const searchParams = useSearchParams();
  const setQuery = useUrlQuerySetter({ history: "push" });

  const sortableColumnIds = useMemo(() => {
    return new Set(
      columns
        .filter((column) => column.enableSorting !== false)
        .map((column) => {
          if (typeof column.id === "string") {
            return column.id;
          }

          const accessorKey = (column as { accessorKey?: string }).accessorKey;
          return typeof accessorKey === "string" ? accessorKey : null;
        })
        .filter((columnId): columnId is string => Boolean(columnId))
    );
  }, [columns]);

  const sorting = useMemo<SortingState>(() => {
    const sortColumn = searchParams.get(SORT_COLUMN_PARAM);
    const sortDirection = searchParams.get(SORT_DIRECTION_PARAM);

    if (!sortColumn || !sortableColumnIds.has(sortColumn)) {
      return [];
    }

    return [
      {
        id: sortColumn,
        desc: sortDirection === "desc",
      },
    ];
  }, [searchParams, sortableColumnIds]);

  const handleSortingChange = (updater: Updater<SortingState>) => {
    const nextSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    const nextSort = nextSorting.find(({ id }) => sortableColumnIds.has(id));

    setQuery({
      [SORT_COLUMN_PARAM]: nextSort?.id ?? null,
      [SORT_DIRECTION_PARAM]: nextSort
        ? nextSort.desc
          ? "desc"
          : "asc"
        : null,
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: handleSortingChange,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  useEffect(() => {
    window.localStorage.setItem(
      PAGE_SIZE_STORAGE_KEY,
      String(pagination.pageSize),
    );
  }, [pagination.pageSize]);

  const getSelectedIds = () =>
    selectedRows.map((row) => (row.original as SelectableRow).id);

  const handleDeleteSelected = () => {
    onDeleteSelected?.(getSelectedIds());
    setRowSelection({});
  };

  const handleUpdateStatus = (status: TaskStatus) => {
    onUpdateStatusSelected?.(getSelectedIds(), status);
    setRowSelection({});
  };

  const showBulkBar = selectedCount > 0 && (onDeleteSelected || onUpdateStatusSelected);

  return (
    <div>
      {showBulkBar && (
        <div className="flex items-center gap-x-2 mb-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          {onUpdateStatusSelected && (
            <Select onValueChange={(v) => handleUpdateStatus(v as TaskStatus)}>
              <SelectTrigger className="h-8 w-[160px] text-sm">
                <SelectValue placeholder="Set status…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskStatus.TODO}>To do</SelectItem>
                <SelectItem value={TaskStatus.IN_PROGRESS}>In progress</SelectItem>
                <SelectItem value={TaskStatus.IN_REVIEW}>In review</SelectItem>
                <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
              </SelectContent>
            </Select>
          )}
          {onDeleteSelected && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="size-4 mr-2" />
              Archive selected
            </Button>
          )}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} entries
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-x-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[88px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {PAGE_SIZE_OPTIONS.map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              <span className="text-sm text-muted-foreground">Page</span>
              <span className="text-sm font-medium">
                {table.getState().pagination.pageIndex + 1}
              </span>
              <span className="text-sm text-muted-foreground">
                of {table.getPageCount()}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
