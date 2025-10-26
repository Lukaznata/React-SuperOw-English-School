import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface CarteiraContextType {
  atualizarCarteira: () => void;
  versaoCarteira: number;
  versaoTransacoes: number;
  atualizarTransacoes: () => void;
}

const CarteiraContext = createContext<CarteiraContextType | undefined>(
  undefined
);

export function CarteiraProvider({ children }: { children: ReactNode }) {
  const [versaoCarteira, setVersaoCarteira] = useState(0);
  const [versaoTransacoes, setVersaoTransacoes] = useState(0);

  const atualizarCarteira = useCallback(() => {
    setVersaoCarteira((prev) => prev + 1);
  }, []);

  const atualizarTransacoes = useCallback(() => {
    setVersaoTransacoes((prev) => prev + 1);
  }, []);

  return (
    <CarteiraContext.Provider
      value={{
        atualizarCarteira,
        versaoCarteira,
        versaoTransacoes,
        atualizarTransacoes,
      }}
    >
      {children}
    </CarteiraContext.Provider>
  );
}

export function useCarteira() {
  const context = useContext(CarteiraContext);
  if (!context) {
    throw new Error("useCarteira deve ser usado dentro de CarteiraProvider");
  }
  return context;
}
