import { useState } from "react";
import api from "../../services/api_connection";
import { useCarteira } from "../../contexts/CarteiraContext";

export default function ButtonReceberValor() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dataPagamento, setDataRecebimento] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const { atualizarCarteira, atualizarTransacoes } = useCarteira();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/contas-receber", {
        nome,
        valor: parseFloat(valor),
        data_recebimento: dataPagamento,
        status: false,
      });

      // Limpa o formulário
      setNome("");
      setValor("");
      setDataRecebimento("");
      setMostrarModal(false);

      // Mostra o toast
      setShowToast(true);
      setTimeout(() => setToastVisible(true), 10);
      setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => setShowToast(false), 300);
      }, 3000);

      // Atualiza a carteira e transações
      atualizarCarteira();
      atualizarTransacoes();
    } catch (err: any) {
      console.error("Erro completo:", err.response?.data);

      // Mostra erro detalhado se houver
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail
            .map((e: any) => `${e.loc?.join(".")} - ${e.msg}`)
            .join("\n");
          setError(errorMessages);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError("Erro ao cadastrar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Fecha apenas se clicar no fundo (backdrop), não no modal
    if (e.target === e.currentTarget) {
      setMostrarModal(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        className={`
        w-full p-3 font-bold cursor-pointer text-green-900 
        bg-white rounded-lg shadow-lg
        flex items-center justify-center 
        hover:bg-green-900 hover:text-white transition-all duration-300
        `}
      >
        Adicionar novo saldo a receber
      </button>

      {/* Toast de Sucesso */}
      {showToast && (
        <div
          className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60] transition-all duration-300"
          style={{
            animation: "slideIn 0.3s ease-out",
          }}
        >
          ✓ Saldo a receber cadastrado com sucesso!
        </div>
      )}

      {mostrarModal && (
        <div
          onClick={handleBackdropClick}
          className={`fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50`}
        >
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-[#113a09]">
              Novo Saldo a Receber
            </h2>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Data de Recebimento
                </label>
                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataRecebimento(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
