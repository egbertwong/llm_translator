export const TitleBar = () => {
  return (
    <div className="flex h-8 items-center border-b bg-card text-foreground">
      <div className="drag-region flex h-full flex-1 items-center px-3 pr-[140px]">
        <span className="text-xs font-semibold tracking-wide">Refinery</span>
      </div>
    </div>
  );
};
