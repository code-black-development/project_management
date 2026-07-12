import {
  useUrlBooleanParam,
  useUrlQuerySetter,
  useUrlStringParam,
} from "@/hooks/use-url-query-state";
import { act, renderHook } from "@testing-library/react";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
};

let pathname = "/workspaces/abc/tasks";
let searchParams = new URLSearchParams("status=TODO&search=copy");

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
}));

describe("use-url-query-state", () => {
  beforeEach(() => {
    router.push.mockReset();
    router.replace.mockReset();
    pathname = "/workspaces/abc/tasks";
    searchParams = new URLSearchParams("status=TODO&search=copy");
  });

  it("replaces the current URL query string by default", () => {
    const { result } = renderHook(() => useUrlQuerySetter());

    act(() => {
      result.current({
        search: "design",
        status: null,
        includeArchived: true,
      });
    });

    expect(router.replace).toHaveBeenCalledWith(
      "/workspaces/abc/tasks?search=design&includeArchived=true",
      { scroll: false }
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("uses push history mode when requested", () => {
    const { result } = renderHook(() =>
      useUrlQuerySetter({ history: "push" })
    );

    act(() => {
      result.current({ view: "calendar" });
    });

    expect(router.push).toHaveBeenCalledWith(
      "/workspaces/abc/tasks?status=TODO&search=copy&view=calendar",
      { scroll: false }
    );
  });

  it("reads and updates a string param", () => {
    const { result } = renderHook(() => useUrlStringParam("search", "fallback"));

    expect(result.current[0]).toBe("copy");

    act(() => {
      result.current[1]("refined");
    });

    expect(router.replace).toHaveBeenCalledWith(
      "/workspaces/abc/tasks?status=TODO&search=refined",
      { scroll: false }
    );
  });

  it("reads and clears a boolean param", () => {
    searchParams = new URLSearchParams("includeArchived=true");
    const { result } = renderHook(() => useUrlBooleanParam("includeArchived"));

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](false);
    });

    expect(router.replace).toHaveBeenCalledWith("/workspaces/abc/tasks", {
      scroll: false,
    });
  });
});
