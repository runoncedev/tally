export function EmptyState({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 py-16 text-zinc-400 dark:text-zinc-500${className ? ` ${className}` : ""}`}
      style={{ viewTransitionName: "empty-state" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="96"
        height="96"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: "visible" }}
      >
        <g style={{ animation: "float 4s ease-in-out infinite" }}>
          <circle cx="7.5" cy="16.5" r="5.5" />
          <path d="M7.001 15.085A1.5 1.5 0 0 1 9 16.5" />
        </g>
        <g style={{ animation: "float-slow 5s ease-in-out infinite 1s" }}>
          <circle cx="18.5" cy="8.5" r="3.5" />
        </g>
        <g style={{ animation: "float-small 3.5s ease-in-out infinite 0.5s" }}>
          <circle cx="7.5" cy="4.5" r="2.5" />
        </g>
      </svg>
      <p
        className="text-lg font-semibold tracking-widest select-none"
        aria-label="Nothing to show yet"
      >
        {"Nothing to show yet".split("").map((char, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              animation: `wave-letter 4s ease-in-out infinite`,
              animationDelay: `${i % 2 === 0 ? 0 : 2}s`,
            }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </p>
    </div>
  );
}
