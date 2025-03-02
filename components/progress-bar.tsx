"use client";

import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // Progress value (can be over 100)
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    setAnimatedProgress(progress);
  }, [progress]);

  const cappedProgress = Math.min(animatedProgress, 100);
  const overagePercentage =
    animatedProgress > 100
      ? ((animatedProgress - 100) / animatedProgress) * 100
      : 0;
  const markerPosition = (100 / animatedProgress) * 100;

  return (
    <div className="relative w-full h-5">
      {/* Base Progress Bar (Capped at 100%) */}
      <Progress
        value={cappedProgress}
        className="h-4 border-[2px] border-white"
      />

      {/* Over 100% Progress */}
      {animatedProgress > 100 && (
        <div
          className="absolute top-0 right-0 h-4 bg-red-700 rounded-r-lg"
          style={{ width: `${overagePercentage}%` }}
        ></div>
      )}

      {/* 100% Marker */}
      <motion.div
        className="absolute h-1 -top-2 w-[2px] bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ left: `${overagePercentage ? markerPosition : 100}%` }}
      />

      {/* Estimate Label (Centered Above 100% Marker) */}
      <span
        className="absolute -top-6 text-xs font-bold text-white"
        style={{
          left: `calc(${overagePercentage ? markerPosition : 100}% - 15px)`,
        }}
      >
        Estimate
      </span>

      <motion.div
        className="absolute h-1 -top-2 w-[2px] bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ left: `${overagePercentage ? 100 : progress}%` }}
      />
      {/* Percentage Label */}
      <span
        className="absolute -top-6 text-xs font-bold text-white"
        style={{
          left: `calc(${overagePercentage ? 100 : progress}% - 15px)`,
        }}
      >
        {animatedProgress}%
      </span>
    </div>
  );
}
