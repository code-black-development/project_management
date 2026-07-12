"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";
import "quill-resize-module/dist/resize.css";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const Editor = ({ value, onChange }: EditorProps) => {
  const ReactQuill = useMemo(
    () =>
      dynamic(async () => {
        const ReactQuillModule = await import("react-quill-new");
        const QuillResizeModule = await import("quill-resize-module");

        const ReactQuillComponent = ReactQuillModule.default;
        const Quill = ReactQuillComponent.Quill;
        const globalWithRegistry = globalThis as typeof globalThis & {
          __quillResizeRegistered?: boolean;
        };

        if (!globalWithRegistry.__quillResizeRegistered) {
          Quill.register("modules/resize", QuillResizeModule.default);
          globalWithRegistry.__quillResizeRegistered = true;
        }

        return ReactQuillComponent;
      }, { ssr: false }),
    []
  );

  const modules = useMemo(
    () => ({
      resize: {
        modules: ["Resize", "DisplaySize", "Toolbar"],
        parchment: {
          image: {
            attribute: ["width"],
            limit: {
              minWidth: 80,
            },
          },
        },
      },
    }),
    []
  );

  return (
    <div className="flex h-full min-w-0 max-w-full flex-col overflow-hidden bg-background [&_.quill]:min-w-0 [&_.quill]:max-w-full [&_.ql-container]:min-w-0 [&_.ql-container]:max-w-full [&_.ql-editor]:overflow-x-auto">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
      />
    </div>
  );
};
