import { useState, useRef, useEffect } from "react";
import SaldoCarteira from "../components/Saldo_carteira";
import Button_receber_valor from "../components/ui/Button_receber_valor";
import Button_pagar_valor from "../components/ui/Button_pagar_valor";
import Calendario from "../components/calendario/Calendario";

export default function Caixa() {
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [mostrarSeletor, setMostrarSeletor] = useState(false);
  const seletorRef = useRef<HTMLDivElement>(null);

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const anosDisponiveis = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  // Fecha o seletor ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        seletorRef.current &&
        !seletorRef.current.contains(event.target as Node)
      ) {
        setMostrarSeletor(false);
      }
    };

    if (mostrarSeletor) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarSeletor]);

  const proximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  const mesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const voltarHoje = () => {
    setMesAtual(new Date().getMonth());
    setAnoAtual(new Date().getFullYear());
    setMostrarSeletor(false);
  };

  return (
    <div className="p-4 space-y-6 bg-[#e6e5e1]">
      {/* Saldo e Botões */}
      <div className="flex gap-4 items-center justify-around">
        <div className="p-4 bg-white rounded-lg shadow-lg min-w-[280px]">
          <SaldoCarteira className="flex gap-3" />
        </div>

        <div className="flex gap-4 w-2/3">
          <Button_pagar_valor />
          <Button_receber_valor />
        </div>
      </div>

      {/* Navegação do Calendário */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          {/* Botão Voltar */}
          <button
            onClick={mesAnterior}
            className="px-4 py-2 bg-gray-200 rounded-lg transition-colors 
            hover:bg-[#232838] hover:text-white/90"
          >
            ← Anterior
          </button>

          {/* Seletor de Mês/Ano */}
          <div className="relative" ref={seletorRef}>
            <button
              onClick={() => setMostrarSeletor(!mostrarSeletor)}
              className="text-2xl font-bold hover:bg-[#000c25] hover:text-white/90 
              px-4 py-2 rounded-lg transition-colors"
            >
              {meses[mesAtual]} {anoAtual} ▼
            </button>

            {mostrarSeletor && (
              <div className="absolute top-full mt-2 bg-white border rounded-lg shadow-xl z-50 p-4 min-w-[300px]">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês
                  </label>
                  <select
                    value={mesAtual}
                    onChange={(e) => setMesAtual(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {meses.map((mes, index) => (
                      <option key={index} value={index}>
                        {mes}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano
                  </label>
                  <select
                    value={anoAtual}
                    onChange={(e) => setAnoAtual(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {anosDisponiveis.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={voltarHoje}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg 
                    hover:bg-[#000c25] transition-colors"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setMostrarSeletor(false)}
                    className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botão Avançar */}
          <button
            onClick={proximoMes}
            className="px-4 py-2 bg-gray-200 rounded-lg transition-colors 
            hover:bg-[#232838] hover:text-white/90"
          >
            Próximo →
          </button>
        </div>

        {/* Calendário */}
        <Calendario mes={mesAtual} ano={anoAtual} />
      </div>
    </div>
  );
}
