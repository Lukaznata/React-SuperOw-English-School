import { useState } from "react";
import { pluralize } from "../../utils/pluralize";
import api from "../../services/api_connection";
import { useCarteira } from "../../contexts/CarteiraContext";

interface Transacao {
  id: number;
  nome: string;
  valor: number;
  tipo: "entrada" | "saida";
  status: boolean;
}

interface DiaCalendarioProps {
  dia: number;
  transacoes: Transacao[];
  mesAtual: boolean;
  onTransacaoAtualizada: () => void; // Callback para recarregar dados
}

export default function DiaCalendario({
  dia,
  transacoes,
  mesAtual,
  onTransacaoAtualizada,
}: DiaCalendarioProps) {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const { atualizarCarteira, atualizarTransacoes } = useCarteira();

  const totalEntradas = transacoes
    .filter((t) => t.tipo === "entrada")
    .reduce((acc, t) => acc + t.valor, 0);

  const totalSaidas = transacoes
    .filter((t) => t.tipo === "saida")
    .reduce((acc, t) => acc + t.valor, 0);

  const transacoesPendentes = transacoes.filter((t) => !t.status).length;

  const handleToggleStatus = async (transacao: Transacao) => {
    setLoading(transacao.id);

    try {
      const endpoint =
        transacao.tipo === "entrada"
          ? `/contas-receber/${transacao.id}/${
              transacao.status ? "deixar-pendente" : "receber"
            }`
          : `/contas-pagar/${transacao.id}/${
              transacao.status ? "deixar-pendente" : "pagar"
            }`;

      await api.patch(endpoint);

      // Recarrega os dados
      onTransacaoAtualizada();
      atualizarCarteira();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Erro ao atualizar status da transação");
    } finally {
      setLoading(null);
    }
  };

  const handleExcluir = async (transacao: Transacao) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir "${transacao.nome}"?`
    );

    if (!confirmar) return;

    setExcluindo(transacao.id);

    try {
      const endpoint =
        transacao.tipo === "entrada"
          ? `/contas-receber/${transacao.id}`
          : `/contas-pagar/${transacao.id}`;

      await api.delete(endpoint);

      // Recarrega os dados
      onTransacaoAtualizada();
      atualizarCarteira();
      atualizarTransacoes();

      // Fecha o modal se não houver mais transações
      const transacoesRestantes = transacoes.filter(
        (t) => t.id !== transacao.id
      );
      if (transacoesRestantes.length === 0) {
        setMostrarDetalhes(false);
      }
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
      alert("Erro ao excluir transação");
    } finally {
      setExcluindo(null);
    }
  };

  return (
    <div
      className={`
        border p-2 min-h-[100px] cursor-pointer
        ${mesAtual ? "bg-white" : "bg-[#d3d2d2]"}
        ${transacoes.length > 0 ? "hover:shadow-lg" : ""}
        ${!mostrarDetalhes && transacoes.length > 0 ? "hover:scale-110" : ""}
      `}
      onClick={() =>
        transacoes.length > 0 && setMostrarDetalhes(!mostrarDetalhes)
      }
    >
      <div className="font-semibold text-gray-700 mb-1">{dia}</div>

      {transacoes.length > 0 && (
        <div className="space-y-1">
          {totalEntradas > 0 && (
            <div className="text-xs text-green-600 font-medium">
              +R$ {totalEntradas.toFixed(2)}
            </div>
          )}
          {totalSaidas > 0 && (
            <div className="text-xs text-red-600 font-medium">
              -R$ {totalSaidas.toFixed(2)}
            </div>
          )}

          <div className="text-xs text-gray-500">
            <div>
              {transacoes.length}{" "}
              {pluralize("transação", "transações", transacoes.length)}
            </div>

            {transacoesPendentes > 0 && (
              <div className="text-yellow-600 font-medium">
                {transacoesPendentes} pendente
                {transacoesPendentes > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal/Detalhes */}
      {mostrarDetalhes && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
          justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            setMostrarDetalhes(false);
          }}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto cursor-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Transações do dia {dia}</h3>

            <div className="space-y-2">
              {transacoes.map((transacao) => (
                <div
                  key={`${transacao.tipo}-${transacao.id}`}
                  className={`
                    p-3 rounded border-l-4 relative
                    ${
                      transacao.tipo === "entrada"
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{transacao.nome}</div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleToggleStatus(transacao)}
                          disabled={
                            loading === transacao.id ||
                            excluindo === transacao.id
                          }
                          className={`
                            text-sm px-3 py-1 rounded transition-colors
                            ${
                              transacao.status
                                ? "bg-green-500 text-white hover:bg-green-700"
                                : "bg-yellow-500 text-white hover:bg-yellow-600"
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {loading === transacao.id
                            ? "..."
                            : transacao.status
                            ? "✓ Pago"
                            : "⏳ Pendente"}
                        </button>

                        <button
                          onClick={() => handleExcluir(transacao)}
                          disabled={
                            loading === transacao.id ||
                            excluindo === transacao.id
                          }
                          className="text-sm px-3 py-1 rounded transition-colors
                            bg-red-500 text-white hover:bg-red-700
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {excluindo === transacao.id ? "..." : "🗑️ Excluir"}
                        </button>
                      </div>
                    </div>
                    <div
                      className={`
                        font-bold text-lg ml-3
                        ${
                          transacao.tipo === "entrada"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      `}
                    >
                      {transacao.tipo === "entrada" ? "+" : "-"}R${" "}
                      {transacao.valor.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setMostrarDetalhes(false)}
              className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
