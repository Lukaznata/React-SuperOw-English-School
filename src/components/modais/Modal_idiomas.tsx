import { useState } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";

interface ModalIdiomaProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalAdicionarIdioma({ onClose, onSuccess }: ModalIdiomaProps) {
  const toast = useToast();
  const [novoIdioma, setNovoIdioma] = useState("");
  const [salvando, setSalvando] = useState(false);

  const formatarMensagemErro = (mensagem: string): string => {
    let mensagemFormatada = mensagem.replace(/Value error,\s*/gi, "");
    if (mensagemFormatada.includes(",")) {
      mensagemFormatada = mensagemFormatada
        .split(",")
        .map((erro) => `Erro: ${erro.trim()}`)
        .join("\n");
    } else {
      mensagemFormatada = `Erro: ${mensagemFormatada}`;
    }
    return mensagemFormatada;
  };

  const handleAdicionar = async () => {
    if (!novoIdioma.trim()) {
      toast.warning("Digite o nome do idioma");
      return;
    }

    setSalvando(true);
    try {
      await api.post("/idiomas/", { nome_idioma: novoIdioma });
      onSuccess();
      onClose();
      toast.success("Idioma adicionado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao adicionar idioma:", err);
      let mensagemErro = "Erro ao adicionar idioma. Tente novamente.";
      if (err.response?.data) {
        if (Array.isArray(err.response.data.detail)) {
          mensagemErro = err.response.data.detail
            .map((error: any) => error.msg || JSON.stringify(error))
            .join(", ");
        } else if (typeof err.response.data.detail === "string") {
          mensagemErro = err.response.data.detail;
        } else if (err.response.data.message) {
          mensagemErro = err.response.data.message;
        }
      } else if (err.message) {
        mensagemErro = err.message;
      }
      mensagemErro = formatarMensagemErro(mensagemErro);
      toast.error(mensagemErro);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Adicionar Novo Idioma
        </h3>

        <input
          type="text"
          value={novoIdioma}
          onChange={(e) => setNovoIdioma(e.target.value)}
          placeholder="Nome do idioma"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          onKeyPress={(e) => e.key === "Enter" && handleAdicionar()}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleAdicionar}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            disabled={salvando}
          >
            {salvando ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Idioma {
  id: number;
  nome_idioma: string;
}

interface ModalExcluirIdiomaProps {
  idioma: Idioma;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalExcluirIdioma({
  idioma,
  onClose,
  onSuccess,
}: ModalExcluirIdiomaProps) {
  const toast = useToast();
  const [excluindo, setExcluindo] = useState(false);

  const formatarMensagemErro = (mensagem: string): string => {
    let mensagemFormatada = mensagem.replace(/Value error,\s*/gi, "");
    if (mensagemFormatada.includes(",")) {
      mensagemFormatada = mensagemFormatada
        .split(",")
        .map((erro) => `Erro: ${erro.trim()}`)
        .join("\n");
    } else {
      mensagemFormatada = `Erro: ${mensagemFormatada}`;
    }
    return mensagemFormatada;
  };

  const handleExcluir = async () => {
    setExcluindo(true);
    try {
      await api.delete(`/idiomas/${idioma.id}`);
      onSuccess();
      onClose();
      toast.success("Idioma excluído com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir idioma:", err);
      let mensagemErro = "Erro ao excluir idioma. Tente novamente.";
      if (err.response?.data) {
        if (Array.isArray(err.response.data.detail)) {
          mensagemErro = err.response.data.detail
            .map((error: any) => error.msg || JSON.stringify(error))
            .join(", ");
        } else if (typeof err.response.data.detail === "string") {
          mensagemErro = err.response.data.detail;
        } else if (err.response.data.message) {
          mensagemErro = err.response.data.message;
        }
      } else if (err.message) {
        mensagemErro = err.message;
      }
      mensagemErro = formatarMensagemErro(mensagemErro);
      toast.error(mensagemErro);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Confirmar Exclusão
        </h3>

        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir o idioma{" "}
          <span className="font-bold">{idioma.nome_idioma}</span>?
        </p>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">
            ⚠️ <strong>Atenção:</strong> Nenhum professor pode ter esse idioma
            atrelado a ele para que seja possível a exclusão. Altere seus
            idiomas antes de excluir.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
            disabled={excluindo}
          >
            Cancelar
          </button>
          <button
            onClick={handleExcluir}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
            disabled={excluindo}
          >
            {excluindo ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
