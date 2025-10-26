import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import erro404Bg from "../assets/Erro404espaço.jpg";
import astronautaImg from "../assets/Astronauta_SuperOw.png";

const Page404 = () => {
  const astronautRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const astronaut = astronautRef.current;
    const container = containerRef.current;
    if (!astronaut || !container) return;

    const size = 256; // tamanho do astronauta (w-64 = 256px)

    const getContainerSize = () => ({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    let { width: containerWidth, height: containerHeight } = getContainerSize();
    let x = Math.random() * (containerWidth - size);
    let y = Math.random() * (containerHeight - size);
    let dx = 0.5; // velocidade horizontal
    let dy = 0.5; // velocidade vertical
    let rotation = 0;

    const animate = () => {
      // Atualiza posição
      x += dx;
      y += dy;
      rotation += 0.15; // rotação constante

      // Colisão com bordas horizontais
      if (x + size >= containerWidth) {
        x = containerWidth - size;
        dx = -dx;
      } else if (x <= 0) {
        x = 0;
        dx = -dx;
      }

      // Colisão com bordas verticais
      if (y + size >= containerHeight) {
        y = containerHeight - size;
        dy = -dy;
      } else if (y <= 0) {
        y = 0;
        dy = -dy;
      }

      // Atualiza info de debug
      setDebugInfo({
        x: Math.round(x),
        y: Math.round(y),
        width: containerWidth,
        height: containerHeight,
      });

      // Aplica transformações
      astronaut.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      requestAnimationFrame(animate);
    };

    animate();

    // Recalcula limites ao redimensionar
    const handleResize = () => {
      const newSize = getContainerSize();
      containerWidth = newSize.width;
      containerHeight = newSize.height;

      if (x + size > containerWidth) x = containerWidth - size;
      if (y + size > containerHeight) y = containerHeight - size;
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundImage: `url(${erro404Bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="h-screen w-screen flex flex-col justify-center items-center gap-4 text-white relative overflow-hidden"
    >
      {/* Borda vermelha para visualizar limites */}
      {/* <div className="absolute inset-0 border-4 border-red-500 pointer-events-none z-50" /> */}

      {/* Info de Debug */}
      {/* <div className="absolute top-4 left-4 bg-black/80 p-4 rounded text-white font-mono text-sm z-50">
        <p>Astronauta X: {debugInfo.x}px</p>
        <p>Astronauta Y: {debugInfo.y}px</p>
        <p>Container Width: {debugInfo.width}px</p>
        <p>Container Height: {debugInfo.height}px</p>
        <p>Tamanho Astronauta: 256px</p>
        <p>Limite X: {debugInfo.width - 256}px</p>
        <p>Limite Y: {debugInfo.height - 256}px</p>
      </div> */}

      {/* Astronauta Super-Ow Flutuante */}
      <div
        ref={astronautRef}
        style={{
          willChange: "transform",
          width: 256,
          height: 256,
          backgroundImage: `url(${astronautaImg})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />

      {/* Conteúdo principal com z-index maior */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <h1 className="font-extrabold text-5xl">
          Erro <b className="text-red-500">404</b>
        </h1>
        <h2 className="font-medium text-lg">Página não encontrada!</h2>

        <button
          onClick={() => navigate(-1)} // volta uma página
          className={`
            mt-32 p-4 text-black
            bg-white rounded-2xl 
            transition-all hover:bg-red-500 hover:font-semibold
            
            `}
        >
          Voltar à página anterior
        </button>
      </div>
    </div>
  );
};

export default Page404;
