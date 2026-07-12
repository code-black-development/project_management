"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type QueryValue = string | number | boolean | null | undefined;
type QueryHistoryMode = "push" | "replace";

const serializeQueryValue = (value: QueryValue) => {
  if (value === null || value === undefined || value === false || value === "") {
    return null;
  }
  if (value === true) {
    return "true";
  }
  return String(value);
};

export const useUrlQuerySetter = (
  options?: { history?: QueryHistoryMode }
) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const history = options?.history ?? "replace";

  return useCallback(
    (updates: Record<string, QueryValue>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        const serialized = serializeQueryValue(value);
        if (serialized === null) {
          params.delete(key);
        } else {
          params.set(key, serialized);
        }
      });

      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;

      if (history === "push") {
        router.push(href, {
          scroll: false,
        });
        return;
      }

      router.replace(href, {
        scroll: false,
      });
    },
    [history, pathname, router, searchParams]
  );
};

export const useUrlStringParam = (key: string, defaultValue?: string) => {
  const searchParams = useSearchParams();
  const setQuery = useUrlQuerySetter();
  const value = searchParams.get(key) ?? defaultValue ?? null;
  const setValue = useCallback(
    (nextValue: string | null) => setQuery({ [key]: nextValue }),
    [key, setQuery]
  );

  return [value, setValue] as const;
};

export const useUrlBooleanParam = (key: string) => {
  const searchParams = useSearchParams();
  const setQuery = useUrlQuerySetter();
  const value = searchParams.get(key) === "true";
  const setValue = useCallback(
    (nextValue: boolean | null) => setQuery({ [key]: nextValue ? true : null }),
    [key, setQuery]
  );

  return [value, setValue] as const;
};

export const useUrlQueryValues = <T extends Record<string, string | null>>(
  keys: Array<keyof T & string>
) => {
  const searchParams = useSearchParams();
  const setQuery = useUrlQuerySetter();

  const values = useMemo(() => {
    return keys.reduce((acc, key) => {
      acc[key as keyof T] = searchParams.get(key) as T[keyof T];
      return acc;
    }, {} as T);
  }, [keys, searchParams]);

  return [values, setQuery] as const;
};
