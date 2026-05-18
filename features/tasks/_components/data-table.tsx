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
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDeleteSelected?: (ids: string[]) => void;
}

const PAGE_SIZE_STORAGE_KEY = "task-table-page-size";
const PAGE_SIZE_OPTIONS = [15, 30, 50, 100];
const DEFAULT_PAGE_SIZE = 30;

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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: 0,
    pageSize: getInitialPageSize(),
  }));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
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

  const handleDeleteSelected = () => {
    const ids = selectedRows.map((row) => (row.original as any).id as string);
    onDeleteSelected?.(ids);
    setRowSelection({});
  };

  return (
    <div>
      {selectedCount > 0 && onDeleteSelected && (
        <div className="flex items-center gap-x-2 mb-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="size-4 mr-2" />
            Delete selected
          </Button>
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
