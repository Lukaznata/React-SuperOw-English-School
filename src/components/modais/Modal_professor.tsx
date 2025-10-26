import { useState, useRef } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";
import ModalAlunosAssociados from "./Modal_alunos_associados";

interface Professor {
  id: number;
  id_idioma: number;
  nome_completo: string;
  data_nasc: string;
  cpf: string;
  telefone: string;
  pdf_contrato: string;
  mei: string;
  nacionalidade: string;
  foto_perfil: string;
  situacao: boolean;
  pix: string;
}

interface Idioma {
  id: number;
  nome_idioma: string;
}

interface ModalProfessorProps {
  professor: Professor;
  idiomas: Record<number, string>;
  idiomasLista: Idioma[];
  onClose: () => void;
  onUpdate: (professorAtualizado: Professor) => void;
  onAbrirModalIdioma: () => void;
  onAbrirModalExcluirIdioma: (idioma: Idioma) => void;
}

export default function ModalProfessor({
  professor,
  idiomas,
  idiomasLista,
  onClose,
  onUpdate,
  onAbrirModalIdioma,
  onAbrirModalExcluirIdioma,
}: ModalProfessorProps) {
  const toast = useToast();
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [dadosEditados, setDadosEditados] =
    useState<Partial<Professor>>(professor);
  const [professorLocal, setProfessorLocal] = useState<Professor>(professor);
  const mouseDownInsideModal = useRef(false);
  const [modalAlunosAberto, setModalAlunosAberto] = useState(false);

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

  const formatarCPF = (valor: string | null | undefined): string => {
    if (!valor) return "";

    const numeros = valor.replace(/\D/g, "");
    const limitado = numeros.slice(0, 11);

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

  const formatarTelefone = (valor: string | null | undefined): string => {
    if (!valor) return " ";

    const numeros = valor.replace(/\D/g, "");
    const limitado = numeros.slice(0, 11);

    if (limitado.length <= 2) return limitado;
    if (limitado.length <= 6)
      return `(${limitado.slice(0, 2)}) ${limitado.slice(2)}`;
    if (limitado.length <= 10) {
      return `(${limitado.slice(0, 2)}) ${limitado.slice(
        2,
        6
      )}-${limitado.slice(6)}`;
    }
    return `(${limitado.slice(0, 2)}) ${limitado.slice(2, 7)}-${limitado.slice(
      7
    )}`;
  };

  const handleInputChange = (
    campo: keyof Professor,
    valor: string | number
  ) => {
    setDadosEditados((prev) => ({
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

  const handleToggleSituacao = async () => {
    try {
      const novaSituacao = !professorLocal.situacao;

      const dadosParaEnviar: any = {
        id_idioma: professorLocal.id_idioma,
        nome_completo: professorLocal.nome_completo,
        data_nasc: professorLocal.data_nasc,
        telefone: professorLocal.telefone.replace(/\D/g, ""), // Remove formatação
        foto_perfil: professorLocal.foto_perfil || "",
        pdf_contrato: professorLocal.pdf_contrato || "",
        nacionalidade: professorLocal.nacionalidade,
        situacao: novaSituacao,
        pix: professorLocal.pix,
      };

      if (professorLocal.cpf) {
        dadosParaEnviar.cpf = professorLocal.cpf.replace(/\D/g, ""); // Remove formatação
      }
      if (professorLocal.mei) {
        dadosParaEnviar.mei = professorLocal.mei;
      }

      await api.put(`/professores/${professorLocal.id}`, dadosParaEnviar);

      const professorAtualizado = { ...professorLocal, situacao: novaSituacao };
      setProfessorLocal(professorAtualizado);
      setDadosEditados(professorAtualizado);
      onUpdate(professorAtualizado);

      toast.success("Situação atualizada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao atualizar situação:", err);
      let mensagemErro = "Erro ao atualizar situação. Tente novamente.";
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
    }
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const dadosParaEnviar: any = {
        id_idioma: dadosEditados.id_idioma || professorLocal.id_idioma,
        nome_completo:
          dadosEditados.nome_completo || professorLocal.nome_completo,
        data_nasc: dadosEditados.data_nasc || professorLocal.data_nasc,
        telefone: (dadosEditados.telefone || professorLocal.telefone).replace(
          /\D/g,
          ""
        ), // Remove formatação
        foto_perfil:
          dadosEditados.foto_perfil || professorLocal.foto_perfil || "",
        pdf_contrato:
          dadosEditados.pdf_contrato !== undefined
            ? dadosEditados.pdf_contrato
            : professorLocal.pdf_contrato || "",
        nacionalidade:
          dadosEditados.nacionalidade || professorLocal.nacionalidade,
        pix:
          dadosEditados.pix !== undefined
            ? dadosEditados.pix
            : professorLocal.pix || "",
      };

      const cpfAtualizado =
        dadosEditados.cpf !== undefined
          ? dadosEditados.cpf
          : professorLocal.cpf;

      // Envia null se não houver números no CPF
      const cpfNumeros = cpfAtualizado ? cpfAtualizado.replace(/\D/g, "") : "";
      dadosParaEnviar.cpf = cpfNumeros.length > 0 ? cpfNumeros : null;

      const meiAtualizado =
        dadosEditados.mei !== undefined
          ? dadosEditados.mei
          : professorLocal.mei;
      if (meiAtualizado && meiAtualizado.trim()) {
        dadosParaEnviar.mei = meiAtualizado;
      } else dadosParaEnviar.mei = null;

      await api.put(`/professores/${professorLocal.id}`, dadosParaEnviar);

      const professorAtualizado = {
        ...professorLocal,
        ...dadosEditados,
      };

      setProfessorLocal(professorAtualizado);
      setDadosEditados(professorAtualizado);
      onUpdate(professorAtualizado);

      setModoEdicao(false);
      toast.success("Professor atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao atualizar professor:", err);
      let mensagemErro = "Erro ao atualizar professor. Tente novamente.";
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
          toast.info("Foto carregada. Clique em 'Salvar' para confirmar.");
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
        const base64 = reader.result?.toString().split(",")[1]; // Base64 puro
        if (base64) {
          handleInputChange("pdf_contrato", base64);
          toast.info("Contrato carregado. Clique em 'Salvar' para confirmar.");
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Por favor, selecione um arquivo PDF.");
    }
  };

  const handleRemoverContrato = () => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o contrato atual?`
    );

    if (!confirmar) return;

    handleInputChange("pdf_contrato", "");
    toast.info("Contrato removido. Clique em 'Salvar' para confirmar.");
  };

  const formatarData = (data: string) => {
    if (!data) return "";
    // Espera data no formato YYYY-MM-DD
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const handleBaixarContrato = () => {
    const base64String =
      dadosEditados.pdf_contrato ?? professorLocal.pdf_contrato;
    if (!base64String) {
      toast.error("Contrato não encontrado.");
      return;
    }
    console.log(professorLocal.pdf_contrato);
    // Remove espaços e quebras de linha
    const cleanBase64 = base64String.replace(/\s/g, ""); // remove espaços/quebras

    // Cria Data URL
    const dataUrl = `data:application/pdf;base64,${cleanBase64}`;

    // Cria link e baixa
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `contrato_${professorLocal.nome_completo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[96vh] overflow-y-auto"
          onMouseDown={handleModalMouseDown}
        >
          {/* Header do Modal */}
          <div className="bg-[#232838] text-white p-6 rounded-t-lg">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white flex-shrink-0 flex items-center justify-center">
                    <img
                      src={`data:image/webp;base64,${
                        dadosEditados.foto_perfil !== undefined
                          ? dadosEditados.foto_perfil
                          : professorLocal.foto_perfil
                      }`}
                      alt={professorLocal.nome_completo}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                  {modoEdicao && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div>
                  {modoEdicao ? (
                    <input
                      type="text"
                      value={dadosEditados.nome_completo || ""}
                      onChange={(e) =>
                        handleInputChange("nome_completo", e.target.value)
                      }
                      className="text-2xl font-bold bg-white text-gray-800 px-2 py-1 rounded mb-3"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">
                      {professorLocal.nome_completo}
                    </h2>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-gray-300">Professor(a) de</p>
                    {modoEdicao ? (
                      <div className="flex gap-2 items-center">
                        <select
                          value={
                            dadosEditados.id_idioma || professorLocal.id_idioma
                          }
                          onChange={(e) =>
                            handleInputChange(
                              "id_idioma",
                              Number(e.target.value)
                            )
                          }
                          className="bg-white text-gray-800 px-2 py-1 rounded"
                        >
                          {idiomasLista.map((idioma) => (
                            <option key={idioma.id} value={idioma.id}>
                              {idioma.nome_idioma}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={onAbrirModalIdioma}
                          className="bg-green-600 hover:bg-green-700 text-white 
                          px-3 py-1 rounded text-sm transition-colors "
                        >
                          Novo
                        </button>
                        <button
                          onClick={() => {
                            const idiomaAtual = idiomasLista.find(
                              (i) =>
                                i.id ===
                                (dadosEditados.id_idioma ||
                                  professorLocal.id_idioma)
                            );
                            if (idiomaAtual)
                              onAbrirModalExcluirIdioma(idiomaAtual);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          title="Excluir idioma selecionado"
                        >
                          🗑️
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-300">
                        {idiomas[professorLocal.id_idioma]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão Ver Alunos */}
              <button
                onClick={() => setModalAlunosAberto(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg 
                transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
                title="Ver alunos associados"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Ver Alunos
              </button>
            </div>
          </div>

          {/* Conteúdo do Modal */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Nascimento */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">
                  Data de Nascimento *
                </p>
                {modoEdicao ? (
                  <input
                    type="date"
                    value={dadosEditados.data_nasc || ""}
                    onChange={(e) =>
                      handleInputChange("data_nasc", e.target.value)
                    }
                    className="text-gray-800 font-semibold border px-2 py-1 rounded w-full"
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">
                    {formatarData(professorLocal.data_nasc)}
                  </p>
                )}
              </div>

              {/* CPF */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">CPF</p>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={formatarCPF(
                      dadosEditados.cpf !== undefined
                        ? dadosEditados.cpf
                        : professorLocal.cpf
                    )}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                    maxLength={14}
                  />
                ) : (
                  <div>
                    {professorLocal.cpf?.length ? (
                      <p className="text-gray-800 font-semibold">
                        {professorLocal.cpf}
                      </p>
                    ) : (
                      <p className="text-red-800 font-semibold">
                        Não informado
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Telefone */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">Telefone *</p>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={formatarTelefone(
                      dadosEditados.telefone || professorLocal.telefone
                    )}
                    onChange={handleTelefoneChange}
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">
                    {formatarTelefone(professorLocal.telefone)}
                  </p>
                )}
              </div>

              {/* MEI */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">MEI</p>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={
                      dadosEditados.mei !== undefined
                        ? dadosEditados.mei
                        : professorLocal.mei || ""
                    }
                    onChange={(e) => handleInputChange("mei", e.target.value)}
                    placeholder="Digite o MEI"
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                  />
                ) : (
                  <div>
                    {professorLocal.mei?.length ? (
                      <p className="text-gray-800 font-semibold">
                        {professorLocal.mei}
                      </p>
                    ) : (
                      <p className="text-red-800 font-semibold">
                        Não informado
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Pix */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">Pix</p>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={
                      dadosEditados.pix !== undefined
                        ? dadosEditados.pix
                        : professorLocal.pix || ""
                    }
                    onChange={(e) => handleInputChange("pix", e.target.value)}
                    placeholder="Chave Pix"
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                  />
                ) : (
                  <div>
                    {professorLocal.pix?.length ? (
                      <p className="text-gray-800 font-semibold">
                        {professorLocal.pix}
                      </p>
                    ) : (
                      <p className="text-red-800 font-semibold">
                        Não informado
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Nacionalidade */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">
                  Nacionalidade
                </p>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={dadosEditados.nacionalidade || ""}
                    onChange={(e) =>
                      handleInputChange("nacionalidade", e.target.value)
                    }
                    placeholder="Digite a nacionalidade"
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                  />
                ) : (
                  <div>
                    {professorLocal.nacionalidade?.length ? (
                      <p className="text-gray-800 font-semibold">
                        {professorLocal.nacionalidade}
                      </p>
                    ) : (
                      <p className="text-red-800 font-semibold">
                        Não informado
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Situação */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">Situação</p>
                <span
                  onClick={handleToggleSituacao}
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                    professorLocal.situacao
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {professorLocal.situacao ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>

            {/* Contrato */}
            <div className="mt-6">
              <p className="text-sm text-gray-500 font-medium mb-2">
                Contrato (PDF)
              </p>
              {modoEdicao ? (
                <div className="space-y-2">
                  {(
                    dadosEditados.pdf_contrato !== undefined
                      ? dadosEditados.pdf_contrato
                      : professorLocal.pdf_contrato
                  ) ? (
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={handleBaixarContrato}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📄 Baixar Contrato Atual
                      </button>
                      <button
                        onClick={handleRemoverContrato}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🗑️ Remover
                      </button>
                    </div>
                  ) : null}
                  <label className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    📎{" "}
                    {(
                      dadosEditados.pdf_contrato !== undefined
                        ? dadosEditados.pdf_contrato
                        : professorLocal.pdf_contrato
                    )
                      ? "Substituir Contrato"
                      : "Adicionar Contrato"}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleContratoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <>
                  {professorLocal.pdf_contrato ? (
                    <button
                      onClick={handleBaixarContrato}
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📄 Baixar Contrato
                    </button>
                  ) : (
                    <span className="text-gray-500">
                      Sem contrato cadastrado
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer do Modal */}
          <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end gap-2">
            {modoEdicao ? (
              <>
                <button
                  onClick={() => {
                    setModoEdicao(false);
                    setDadosEditados(professorLocal);
                  }}
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
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setModoEdicao(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Alunos Associados */}
      {modalAlunosAberto && (
        <ModalAlunosAssociados
          professorId={professorLocal.id}
          professorNome={professorLocal.nome_completo}
          onClose={() => setModalAlunosAberto(false)}
        />
      )}
    </>
  );
}
