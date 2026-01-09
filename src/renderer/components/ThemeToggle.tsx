type ThemeToggleProps = {
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => void;
};

export const ThemeToggle = ({ theme, onChange }: ThemeToggleProps) => {
  return (
    <button
      type="button"
      className="ghost-button"
      onClick={() => onChange(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
};
