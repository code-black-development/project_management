"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.bubble.css";

interface PreviewProps {
  value: string;
}

export const Preview = ({ value }: PreviewProps) => {
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill-new"), { ssr: false }),
    []
  );

  return (
    <div className="min-w-0 max-w-full overflow-hidden [&_.quill]:min-w-0 [&_.quill]:max-w-full [&_.ql-container]:min-w-0 [&_.ql-container]:max-w-full [&_.ql-editor]:overflow-x-auto">
      <ReactQuill theme="bubble" value={value} readOnly />
    </div>
  );
};
