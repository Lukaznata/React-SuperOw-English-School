import { Link, useLocation } from "react-router-dom";

interface ButtonMenuProps {
  text: string;
  to: string;
}

export default function ButtonMenu({ text, to }: ButtonMenuProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="inline-block z-10 relative">
      <span
        className={`
          px-3 py-2 rounded-lg inline-block
          transition-all duration-200
          relative overflow-hidden group
          ${
            isActive
              ? "text-white"
              : "text-white/80 hover:scale-125  hover:shadow-[3px_2px_4px_rgba(0,0,0,0.8)]"
          }
        `}
      >
        {text}
        {/* Efeito de reflexo */}
        {!isActive && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
        )}
      </span>
    </Link>
  );
}
