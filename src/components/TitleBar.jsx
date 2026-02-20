export default function TitleBar() {
  return (
    <div className="h-8 shrink-0 flex items-center bg-zinc-900 border-b border-zinc-800 select-none z-50">
      <div className="flex items-center gap-2 px-4 text-zinc-400 pointer-events-none">
        <img src="/favicon.svg" alt="Stash" className="w-4 h-4" />
        <span className="text-[13px] font-medium tracking-wide text-zinc-300">Stash</span>
      </div>
    </div>
  );
}
