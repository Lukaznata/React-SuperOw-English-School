import { useState, useEffect } from "react";
import api from "../../services/api_connection";
import DiaCalendario from "./DiaCalendario";
import { useCarteira } from "../../contexts/CarteiraContext";

interface Transacao {
  id: number;
  nome: string;
  valor: string; // A API retorna como string
  data_pagamento?: string; // Para contas a pagar
  data_recebimento?: string; // Para contas a receber
  status: boolean;
}

interface CalendarioProps {
  mes: number; // 0-11 (Janeiro = 0)
  ano: number;
}

export default function Calendario({ mes, ano }: CalendarioProps) {
  const [transacoes, setTransacoes] = useState<{
    entradas: Transacao[];
    saidas: Transacao[];
  }>({ entradas: [], saidas: [] });
  const [loading, setLoading] = useState(true);
  const { versaoTransacoes } = useCarteira();

  const fetchTransacoes = async () => {
    setLoading(true);
    try {
      const [entradas, saidas] = await Promise.all([
        api.get("/contas-receber"),
        api.get("/contas-pagar"),
      ]);

      setTransacoes({
        entradas: entradas.data.items || [],
        saidas: saidas.data.items || [],
      });
    } catch (err) {
      console.error("Erro ao carregar transações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransacoes();
  }, [mes, ano, versaoTransacoes]); // Adiciona versaoTransacoes aqui

  // Gera os dias do calendário
  const gerarDiasCalendario = () => {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay(); // 0 = Domingo

    const dias = [];

    // Dias do mês anterior (para preencher)
    for (let i = 0; i < diaSemanaInicio; i++) {
      const diaAnterior = new Date(ano, mes, -i);
      dias.unshift({
        dia: diaAnterior.getDate(),
        data: diaAnterior,
        mesAtual: false,
        key: `${diaAnterior.getFullYear()}-${diaAnterior.getMonth()}-${diaAnterior.getDate()}`, // Key única
      });
    }

    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mes, dia);
      dias.push({
        dia,
        data,
        mesAtual: true,
        key: `${ano}-${mes}-${dia}`, // Key única
      });
    }

    // Dias do próximo mês (para completar a grade)
    const diasRestantes = 42 - dias.length; // 6 semanas * 7 dias
    for (let i = 1; i <= diasRestantes; i++) {
      const proximoDia = new Date(ano, mes + 1, i);
      dias.push({
        dia: i,
        data: proximoDia,
        mesAtual: false,
        key: `${proximoDia.getFullYear()}-${proximoDia.getMonth()}-${i}`, // Key única
      });
    }

    return dias;
  };

  const getTransacoesDoDia = (data: Date) => {
    const dataStr = data.toISOString().split("T")[0];

    const entradasDoDia = transacoes.entradas
      .filter((t) => t.data_recebimento === dataStr)
      .map((t) => ({
        ...t,
        tipo: "entrada" as const,
        valor: parseFloat(t.valor), // Converte string para number
      }));

    const saidasDoDia = transacoes.saidas
      .filter((t) => t.data_pagamento === dataStr)
      .map((t) => ({
        ...t,
        tipo: "saida" as const,
        valor: parseFloat(t.valor), // Converte string para number
      }));

    return [...entradasDoDia, ...saidasDoDia];
  };

  const diasCalendario = gerarDiasCalendario();

  if (loading) {
    return <div className="text-center p-8">Carregando calendário...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
          <div
            key={dia}
            className="text-center font-semibold text-gray-600 py-2"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grade do calendário */}
      <div className="grid grid-cols-7 gap-1">
        {diasCalendario.map((diaInfo) => (
          <DiaCalendario
            key={diaInfo.key}
            dia={diaInfo.dia}
            transacoes={getTransacoesDoDia(diaInfo.data)}
            mesAtual={diaInfo.mesAtual}
            onTransacaoAtualizada={fetchTransacoes}
          />
        ))}
      </div>
    </div>
  );
}
