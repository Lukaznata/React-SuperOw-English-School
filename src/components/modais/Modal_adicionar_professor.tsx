import { useState, useRef, useEffect } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";
import fotoPerfilPadrao from "../../assets/foto_base_perfil.png";

interface ModalAdicionarProfessorProps {
  onClose: () => void;
  onSuccess: () => Promise<void>;
  idiomasLista: { id: number; nome_idioma: string }[];
  onAbrirModalIdioma: () => void;
  onAbrirModalExcluirIdioma: (idioma: {
    id: number;
    nome_idioma: string;
  }) => void;
}

export default function ModalAdicionarProfessor({
  onClose,
  onSuccess,
  idiomasLista,
  onAbrirModalIdioma,
}: ModalAdicionarProfessorProps) {
  const toast = useToast();
  const [salvando, setSalvando] = useState(false);
  const mouseDownInsideModal = useRef(false);

  const [dadosProfessor, setDadosProfessor] = useState({
    id_idioma: idiomasLista[0]?.id || 0,
    nome_completo: "",
    data_nasc: "",
    cpf: "",
    telefone: "",
    pdf_contrato: "",
    mei: "",
    nacionalidade: "",
    foto_perfil: "",
    situacao: true,
  });

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

  const handleInputChange = (campo: string, valor: string | number) => {
    setDadosProfessor((prev) => ({
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
          toast.success("Foto carregada!");
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Por favor, selecione uma imagem válida (JPG, PNG, WebP).");
    }
  };

  const handleContratoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString().split(",")[1];
        if (base64) {
          handleInputChange("pdf_contrato", base64);
          toast.success("Contrato carregado!");
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Por favor, selecione um arquivo PDF.");
    }
  };

  const handleSalvar = async () => {
    // Validações básicas
    if (!dadosProfessor.nome_completo.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }
    if (!dadosProfessor.data_nasc) {
      toast.error("Data de nascimento é obrigatória.");
      return;
    }
    if (!dadosProfessor.telefone.trim()) {
      toast.error("Telefone é obrigatório.");
      return;
    }
    if (!dadosProfessor.nacionalidade.trim()) {
      toast.error("Nacionalidade é obrigatória.");
      return;
    }

    let fotoPerfilBase64 = dadosProfessor.foto_perfil;
    if (!fotoPerfilBase64) {
      fotoPerfilBase64 = await formatarImagemPadraoParaBase64(fotoPerfilPadrao);
    }

    setSalvando(true);
    try {
      const dadosParaEnviar: any = {
        id_idioma: dadosProfessor.id_idioma,
        nome_completo: dadosProfessor.nome_completo.trim(),
        data_nasc: dadosProfessor.data_nasc,
        telefone: dadosProfessor.telefone.replace(/\D/g, ""), // Remove formatação
        nacionalidade: dadosProfessor.nacionalidade.trim(),
        situacao: dadosProfessor.situacao,
        foto_perfil: fotoPerfilBase64,
        pdf_contrato: dadosProfessor.pdf_contrato || "",
      };

      // Adiciona campos opcionais apenas se preenchidos
      if (dadosProfessor.cpf.trim()) {
        dadosParaEnviar.cpf = dadosProfessor.cpf.replace(/\D/g, ""); // Remove formatação
      }
      if (dadosProfessor.mei.trim()) {
        dadosParaEnviar.mei = dadosProfessor.mei.trim();
      }

      await api.post("/professores", dadosParaEnviar);

      toast.success("Professor cadastrado com sucesso!");
      await onSuccess(); // Recarrega a lista de professores
      onClose();
    } catch (err: any) {
      console.error("Erro ao cadastrar professor:", err);
      let mensagemErro = "Erro ao cadastrar professor. Tente novamente.";
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
    if (e.target === e.currentTarget) {
      mouseDownInsideModal.current = false;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !mouseDownInsideModal.current) {
      onClose();
    }
    mouseDownInsideModal.current = false;
  };

  const handleModalMouseDown = () => {
    mouseDownInsideModal.current = true;
  };

  useEffect(() => {
    if (idiomasLista.length > 0 && !dadosProfessor.id_idioma) {
      setDadosProfessor((prev) => ({
        ...prev,
        id_idioma: idiomasLista[0].id,
      }));
    }
  }, [idiomasLista]);

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
        {/* Header */}
        <div className="bg-[#232838] text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Adicionar Novo Professor</h2>
          <p className="text-gray-300 text-sm mt-1">
            Campos marcados com * são obrigatórios
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={dadosProfessor.nome_completo}
                onChange={(e) =>
                  handleInputChange("nome_completo", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome completo"
              />
            </div>

            {/* Idioma */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Idioma *
              </label>
              {idiomasLista.length > 0 ? (
                <select
                  value={dadosProfessor.id_idioma}
                  onChange={(e) =>
                    handleInputChange("id_idioma", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {idiomasLista.map((idioma) => (
                    <option key={idioma.id} value={idioma.id}>
                      {idioma.nome_idioma}
                    </option>
                  ))}
                </select>
              ) : (
                <b className="font-normal text-gray-600">
                  Nenhum idioma cadastrado
                </b>
              )}

              <button
                onClick={onAbrirModalIdioma}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                + Novo
              </button>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento *
              </label>
              <input
                type="date"
                value={dadosProfessor.data_nasc}
                onChange={(e) => handleInputChange("data_nasc", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                value={dadosProfessor.cpf}
                onChange={handleCPFChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                value={dadosProfessor.telefone}
                onChange={handleTelefoneChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {/* MEI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MEI
              </label>
              <input
                type="text"
                value={dadosProfessor.mei}
                onChange={(e) => handleInputChange("mei", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número do MEI"
              />
            </div>

            {/* Nacionalidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nacionalidade *
              </label>
              <input
                type="text"
                value={dadosProfessor.nacionalidade}
                onChange={(e) =>
                  handleInputChange("nacionalidade", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Brasileira"
              />
            </div>

            {/* Foto de Perfil */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-4">
                {dadosProfessor.foto_perfil && (
                  <div className="w-20 h-24 rounded-full overflow-hidden border-2 border-gray-300">
                    <img
                      src={`data:image/webp;base64,${dadosProfessor.foto_perfil}`}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors text-center">
                    <p className="text-sm text-gray-600">
                      {dadosProfessor.foto_perfil
                        ? "Clique para alterar a foto"
                        : "Clique para adicionar uma foto"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG ou WebP (máx. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Contrato PDF */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contrato (PDF)
              </label>
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors text-center">
                  <p className="text-sm text-gray-600">
                    {dadosProfessor.pdf_contrato
                      ? "✓ Contrato anexado - Clique para alterar"
                      : "Clique para adicionar o contrato"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Apenas PDF</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleContratoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            {salvando ? "Salvando..." : "Cadastrar Professor"}
          </button>
        </div>
      </div>
    </div>
  );
}
