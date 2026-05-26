"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const Editor = ({ value, onChange }: EditorProps) => {
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill-new"), { ssr: false }),
    []
  );

  return (
    <div className="flex h-full min-w-0 max-w-full flex-col overflow-hidden bg-background [&_.quill]:min-w-0 [&_.quill]:max-w-full [&_.ql-container]:min-w-0 [&_.ql-container]:max-w-full [&_.ql-editor]:overflow-x-auto">
      <ReactQuill theme="snow" value={value} onChange={onChange} />
    </div>
  );
};
