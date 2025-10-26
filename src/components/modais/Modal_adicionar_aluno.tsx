import { useState, useRef } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";
import fotoPerfilPadrao from "../../assets/foto_base_perfil.png";

interface ModalAdicionarAlunoProps {
  onClose: () => void;
  onAlunoAdicionado: (novoAluno: any) => void;
}

export default function ModalAdicionarAluno({
  onClose,
  onAlunoAdicionado,
}: ModalAdicionarAlunoProps) {
  const toast = useToast();
  const [salvando, setSalvando] = useState(false);
  const mouseDownInsideModal = useRef(false);

  const [dadosAluno, setDadosAluno] = useState({
    nome_completo: "",
    data_nasc: "",
    cpf: "",
    telefone: "",
    preferencia_pagamento: "PIX",
    dia_cobranca: 1,
    foto_perfil: "",
    pais: "",
    situacao: true,
  });

  // Adicione os estados
  const [email, setEmail] = useState("");
  const [observacao, setObservacao] = useState("");

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

  const formatarCPF = (valor: string): string => {
    // Remove tudo que não é dígito
    const numeros = valor.replace(/\D/g, "");

    // Limita a 11 dígitos
    const limitado = numeros.slice(0, 11);

    // Aplica a máscara
    if (limitado.length <= 3) return limitado;
    if (limitado.length <= 6)
      return `${limitado.slice(0, 3)}.${limitado.slice(3)}`;
    if (limitado.length <= 9)
      return `${limitado.slice(0, 3)}.${limitado.slice(3, 6)}.${limitado.slice(
        6
      )}`;
    return `${limitado.slice(0, 3)}.${limitado.slice(3, 6)}.${limitado.slice(
      6,
      9
    )}-${limitado.slice(9)}`;
  };

  const formatarTelefone = (valor: string): string => {
    // Remove tudo que não é dígito
    const numeros = valor.replace(/\D/g, "");

    // Limita a 11 dígitos (celular com DDD)
    const limitado = numeros.slice(0, 11);

    // Aplica a máscara
    if (limitado.length <= 2) return limitado;
    if (limitado.length <= 6)
      return `(${limitado.slice(0, 2)}) ${limitado.slice(2)}`;
    if (limitado.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return `(${limitado.slice(0, 2)}) ${limitado.slice(
        2,
        6
      )}-${limitado.slice(6)}`;
    }
    // Celular: (XX) XXXXX-XXXX
    return `(${limitado.slice(0, 2)}) ${limitado.slice(2, 7)}-${limitado.slice(
      7
    )}`;
  };

  const formatarImagemPadraoParaBase64 = async (
    url: string
  ): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleInputChange = (
    campo: string,
    valor: string | number | boolean
  ) => {
    setDadosAluno((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarCPF(e.target.value);
    handleInputChange("cpf", valorFormatado);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarTelefone(e.target.value);
    handleInputChange("telefone", valorFormatado);
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString().split(",")[1];
        if (base64) {
          handleInputChange("foto_perfil", base64);
          toast.info("Foto carregada.");
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Por favor, selecione uma imagem válida (JPG, PNG, WebP).");
    }
  };

  const handleSalvar = async () => {
    // Validações básicas
    if (!dadosAluno.nome_completo.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }
    if (!dadosAluno.data_nasc) {
      toast.error("Data de nascimento é obrigatória.");
      return;
    }
    if (!dadosAluno.telefone.trim()) {
      toast.error("Telefone é obrigatório.");
      return;
    }
    if (!dadosAluno.pais.trim()) {
      toast.error("País é obrigatório.");
      return;
    }

    let fotoPerfilBase64 = dadosAluno.foto_perfil;
    if (!fotoPerfilBase64) {
      fotoPerfilBase64 = await formatarImagemPadraoParaBase64(fotoPerfilPadrao);
    }

    setSalvando(true);
    try {
      const dadosParaEnviar: any = {
        nome_completo: dadosAluno.nome_completo.trim(),
        data_nasc: dadosAluno.data_nasc,
        telefone: dadosAluno.telefone.replace(/\D/g, ""), // Remove formatação
        preferencia_pagamento: dadosAluno.preferencia_pagamento,
        dia_cobranca: dadosAluno.dia_cobranca,
        pais: dadosAluno.pais.trim(),
        situacao: dadosAluno.situacao,
        foto_perfil: fotoPerfilBase64,
        email: email || null,
        observacao: observacao || null,
      };

      // Adiciona campos opcionais apenas se preenchidos
      if (dadosAluno.cpf.trim()) {
        dadosParaEnviar.cpf = dadosAluno.cpf.replace(/\D/g, ""); // Remove formatação
      }

      const response = await api.post("/alunos", dadosParaEnviar);

      toast.success("Aluno cadastrado com sucesso!");
      onAlunoAdicionado(response.data);
      onClose();
    } catch (err: any) {
      console.error("Erro ao cadastrar aluno:", err);
      let mensagemErro = "Erro ao cadastrar aluno. Tente novamente.";
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

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    // Verifica se o clique foi diretamente no backdrop
    if (e.target === e.currentTarget) {
      mouseDownInsideModal.current = false;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    // Só fecha se o mousedown também foi no backdrop
    if (e.target === e.currentTarget && !mouseDownInsideModal.current) {
      onClose();
    }
    mouseDownInsideModal.current = false;
  };

  const handleModalMouseDown = () => {
    mouseDownInsideModal.current = true;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[96vh] overflow-y-auto"
        onMouseDown={handleModalMouseDown}
      >
        {/* Header do Modal */}
        <div className="bg-[#1a472f] text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Cadastrar Novo Aluno</h2>
              <p className="text-gray-200 text-sm mt-1">
                Preencha os dados do aluno
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6">
          {/* Foto de Perfil */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-32 h-32 mb-4 overflow-hidden rounded-full flex items-center justify-center border-4 border-gray-300 bg-gray-100">
              {dadosAluno.foto_perfil && (
                <img
                  src={`data:image/webp;base64,${dadosAluno.foto_perfil}`}
                  alt="Preview"
                  className="w-full h-auto object-cover"
                />
              )}
            </div>
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              📷 Escolher Foto
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG ou WebP (máx. 5MB)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={dadosAluno.nome_completo}
                onChange={(e) =>
                  handleInputChange("nome_completo", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Digite o nome completo"
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento *
              </label>
              <input
                type="date"
                value={dadosAluno.data_nasc}
                onChange={(e) => handleInputChange("data_nasc", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                value={dadosAluno.cpf}
                onChange={handleCPFChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="text"
                value={dadosAluno.telefone}
                onChange={handleTelefoneChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País *
              </label>
              <input
                type="text"
                value={dadosAluno.pais}
                onChange={(e) => handleInputChange("pais", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Brasil"
              />
            </div>

            {/* Preferência de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferência de Pagamento *
              </label>
              <select
                value={dadosAluno.preferencia_pagamento}
                onChange={(e) =>
                  handleInputChange("preferencia_pagamento", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="PIX">PIX</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Boleto">Boleto</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>

            {/* Dia de Cobrança */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dia de Cobrança *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dadosAluno.dia_cobranca}
                onChange={(e) =>
                  handleInputChange(
                    "dia_cobranca",
                    parseInt(e.target.value) || 1
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Situação */}
            <div className="flex items-center gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Situação
              </label>
              <button
                type="button"
                onClick={() =>
                  handleInputChange("situacao", !dadosAluno.situacao)
                }
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  dadosAluno.situacao
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
              >
                {dadosAluno.situacao ? "Ativo" : "Inativo"}
              </button>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Observação */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observação
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"
                placeholder="Observações sobre o aluno..."
              />
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Cadastrar Aluno"}
          </button>
        </div>
      </div>
    </div>
  );
}
