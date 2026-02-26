"use client";

interface AppHeaderProps {
  /** Show back arrow on the left */
  showBack?: boolean;
  onBack?: () => void;
  /** Center title (e.g. "Crusties", "Baking...", "Your Crustie") */
  title?: string;
  /** Right-side element (e.g. PFP avatar) */
  rightElement?: React.ReactNode;
  /** "light" = cream bg (orange/red text), "dark" = gradient bg (white text) */
  variant?: "light" | "dark";
}

const logoAndBrand = (
  <div className="flex items-center gap-3">
    <img
      src="/images/logo.png"
      alt="Crusties"
      className="w-12 h-12 rounded-xl"
      style={{ boxShadow: "2px 2px 0px rgba(0,0,0,0.1)" }}
    />
    <span className="text-tomato-red font-display" style={{ fontSize: "32px" }}>
      PIZZA PARTY
    </span>
  </div>
);

export function AppHeader({
  showBack,
  onBack,
  title,
  rightElement,
  variant = "light",
}: AppHeaderProps) {
  const textClass = variant === "dark" ? "text-white" : "text-orange-primary";
  const backClass =
    variant === "dark"
      ? "text-white hover:text-cheese-yellow"
      : "text-orange-primary hover:text-orange-dark";

  return (
    <header className="px-5 py-4 flex items-center justify-between relative z-10">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className={`flex items-center gap-2 transition-colors shrink-0 ${backClass}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}
        {logoAndBrand}
        {title ? (
          <h2 className={`font-display shrink-0 ${textClass}`} style={{ fontSize: "32px" }}>
            {title}
          </h2>
        ) : null}
      </div>
      {rightElement ? <div className="shrink-0">{rightElement}</div> : <div className="w-8 shrink-0" />}
    </header>
  );
}
