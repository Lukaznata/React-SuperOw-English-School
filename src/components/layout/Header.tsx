import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import ButtonMenu from "../ui/Button_menu";
import { useAuth } from "../../contexts/AuthContext";

const menuItems = [
  { text: "CAIXA", to: "/caixa" },
  { text: "AFAZERES DIÁRIOS", to: "/afazeres" },
  { text: "AULAS", to: "/aulas" },
  { text: "ALUNOS", to: "/alunos" },
  { text: "PROFESSORES", to: "/professores" },
];

export default function Header() {
  const location = useLocation();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const buttonsRef = useRef<HTMLDivElement[]>([]);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const activeIndex = menuItems.findIndex(
    (item) => item.to === location.pathname
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (activeIndex !== -1 && buttonsRef.current[activeIndex]) {
      const button = buttonsRef.current[activeIndex];
      if (button) {
        setIndicatorStyle({
          left: button.offsetLeft,
          width: button.offsetWidth,
        });
      }
    }
  }, [activeIndex]);

  return (
    <header
      className={`
        h-[20%] bg-[#232838] text-white font-semibold py-4 
        relative`}
    >
      <nav className="flex justify-around items-center relative h-full">
        {/* Indicador animado */}
        {activeIndex !== -1 && (
          <div
            className={`
              absolute bg-[#000c25] rounded-lg bottom-[4px]
              transition-all duration-500 ease-in-out h-full`}
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
        )}

        {/* Botões de navegação */}
        {menuItems.map((item, index) => (
          <div
            key={item.to}
            ref={(el) => {
              if (el) buttonsRef.current[index] = el;
            }}
          >
            <ButtonMenu text={item.text} to={item.to} />
          </div>
        ))}

        {/* Botão de Sair */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 hover:text-red-400 transition-opacity"
        >
          SAIR
        </button>
      </nav>
    </header>
  );
}
