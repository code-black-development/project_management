interface TaskOverviewPropertyProps {
  label: string;
  children: React.ReactNode;
}

const TaskOverviewProperty = ({ label, children }: TaskOverviewPropertyProps) => {
  return (
    <div className="flex items-center gap-x-3 py-0.5">
      <div className="min-w-[110px] shrink-0">
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <div className="flex items-center gap-x-2 min-w-0">{children}</div>
    </div>
  );
};

export default TaskOverviewProperty;
