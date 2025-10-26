import { useState, useRef } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";
import ModalProfessoresAssociados from "./Modal_professores_associados";
import ModalMensalidade from "./Modal_mensalidade";

interface Aluno {
  id: number;
  nome_completo: string;
  data_nasc: string;
  cpf: string;
  telefone: string;
  preferencia_pagamento: string;
  dia_cobranca: number;
  foto_perfil: string;
  pais: string;
  situacao: boolean;
  email?: string;
  observacao?: string;
}

interface ModalAlunoProps {
  aluno: Aluno;
  idiomas: Record<number, string>;
  onClose: () => void;
  onUpdate: (alunoAtualizado: Aluno) => void;
}

export default function ModalAluno({
  aluno,
  idiomas,
  onClose,
  onUpdate,
}: ModalAlunoProps) {
  const toast = useToast();
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [dadosEditados, setDadosEditados] = useState<Partial<Aluno>>(aluno);
  const [alunoLocal, setAlunoLocal] = useState<Aluno>(aluno);
  const [modalProfessoresAberto, setModalProfessoresAberto] = useState(false);
  const [mostrarMensalidades, setMostrarMensalidades] = useState(false);
  const mouseDownInsideModal = useRef(false);

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

  const formatarTelefone = (telefone: string | null | undefined): string => {
    if (!telefone) return " ";

    const numeros = telefone.replace(/\D/g, "");
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

  const handleInputChange = (campo: keyof Aluno, valor: string | number) => {
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
      const novaSituacao = !alunoLocal.situacao;

      const dadosParaEnviar: any = {
        nome_completo: alunoLocal.nome_completo,
        data_nasc: alunoLocal.data_nasc,
        telefone: alunoLocal.telefone.replace(/\D/g, ""),
        preferencia_pagamento: alunoLocal.preferencia_pagamento,
        dia_cobranca: alunoLocal.dia_cobranca,
        foto_perfil: alunoLocal.foto_perfil || "",
        pais: alunoLocal.pais,
        situacao: novaSituacao,
        email: alunoLocal.email,
        observacao: alunoLocal.observacao,
      };

      if (alunoLocal.cpf) {
        dadosParaEnviar.cpf = alunoLocal.cpf.replace(/\D/g, "");
      }

      await api.put(`/alunos/${alunoLocal.id}`, dadosParaEnviar);

      const alunoAtualizado = { ...alunoLocal, situacao: novaSituacao };
      setAlunoLocal(alunoAtualizado);
      setDadosEditados(alunoAtualizado);
      onUpdate(alunoAtualizado);

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
        nome_completo: dadosEditados.nome_completo || alunoLocal.nome_completo,
        data_nasc: dadosEditados.data_nasc || alunoLocal.data_nasc,
        telefone: (dadosEditados.telefone || alunoLocal.telefone).replace(
          /\D/g,
          ""
        ),
        preferencia_pagamento:
          dadosEditados.preferencia_pagamento ||
          alunoLocal.preferencia_pagamento,
        dia_cobranca: dadosEditados.dia_cobranca || alunoLocal.dia_cobranca,
        foto_perfil: dadosEditados.foto_perfil || alunoLocal.foto_perfil || "",
        pais: dadosEditados.pais || alunoLocal.pais,
        situacao: alunoLocal.situacao,
        email: dadosEditados.email || alunoLocal.email,
        observacao: dadosEditados.observacao || alunoLocal.observacao,
      };

      const cpfAtualizado =
        dadosEditados.cpf !== null ? dadosEditados.cpf : alunoLocal.cpf;

      // Envia null se não houver números no CPF
      const cpfNumeros = cpfAtualizado ? cpfAtualizado.replace(/\D/g, "") : "";
      dadosParaEnviar.cpf = cpfNumeros.length > 0 ? cpfNumeros : null;

      await api.put(`/alunos/${alunoLocal.id}`, dadosParaEnviar);

      const alunoAtualizado = {
        ...alunoLocal,
        ...dadosEditados,
      };

      setAlunoLocal(alunoAtualizado);
      setDadosEditados(alunoAtualizado);
      onUpdate(alunoAtualizado);

      setModoEdicao(false);
      toast.success("Aluno atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao atualizar aluno:", err);
      let mensagemErro = "Erro ao atualizar aluno. Tente novamente.";
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

  const formatarData = (data: string) => {
    if (!data) return "";
    const date = new Date(data);
    return date.toLocaleDateString("pt-BR");
  };

  // Handlers para fechar ao clicar fora
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col"
          onMouseDown={handleModalMouseDown}
        >
          {/* Header do Modal - Fixo */}
          <div className="bg-[#1a472f] text-white p-6 rounded-t-lg flex-shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4 items-center min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white flex items-center justify-center">
                    <img
                      src={`data:image/webp;base64,${
                        dadosEditados.foto_perfil !== undefined
                          ? dadosEditados.foto_perfil
                          : alunoLocal.foto_perfil
                      }`}
                      alt={alunoLocal.nome_completo}
                      className="w-full h-auto object-center"
                      loading="lazy"
                    />
                  </div>
                  {modoEdicao && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                <div className="min-w-0">
                  {modoEdicao ? (
                    <input
                      type="text"
                      value={dadosEditados.nome_completo || ""}
                      onChange={(e) =>
                        handleInputChange("nome_completo", e.target.value)
                      }
                      className="text-xl font-bold bg-white text-gray-800 px-2 py-1 rounded w-full"
                    />
                  ) : (
                    <h2 className="text-xl font-bold break-words">
                      {alunoLocal.nome_completo}
                    </h2>
                  )}
                </div>
              </div>

              {/* Botão Ver Professores */}
              <button
                onClick={() => setModalProfessoresAberto(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg 
                transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
                title="Ver professores associados"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
                Professores
              </button>
            </div>
          </div>

          {/* Conteúdo do Modal - Com Scroll */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Botão Mensalidades */}
            <button
              onClick={() => setMostrarMensalidades(true)}
              className="w-full mb-6 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Mensalidades
            </button>

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
                    {formatarData(alunoLocal.data_nasc)}
                  </p>
                )}
              </div>

              {/* CPF */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">CPF</p>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={formatarCPF(dadosEditados.cpf || alunoLocal.cpf)}
                    onChange={handleCPFChange}
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                ) : (
                  <div>
                    {alunoLocal.cpf?.length ? (
                      <p className="text-gray-800 font-semibold">
                        {alunoLocal.cpf}
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
                      dadosEditados.telefone || alunoLocal.telefone
                    )}
                    onChange={handleTelefoneChange}
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">
                    {formatarTelefone(alunoLocal.telefone)}
                  </p>
                )}
              </div>

              {/* País */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">País</p>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={dadosEditados.pais || ""}
                    onChange={(e) => handleInputChange("pais", e.target.value)}
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                    placeholder="Digite o país"
                  />
                ) : (
                  <div>
                    {alunoLocal.pais?.length ? (
                      <p className="text-gray-800 font-semibold">
                        {alunoLocal.pais}
                      </p>
                    ) : (
                      <p className="text-red-800 font-semibold">
                        Não informado
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Preferência de Pagamento */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">
                  Preferência de Pagamento *
                </p>
                {modoEdicao ? (
                  <select
                    value={dadosEditados.preferencia_pagamento || ""}
                    onChange={(e) =>
                      handleInputChange("preferencia_pagamento", e.target.value)
                    }
                    className="text-gray-800 font-semibold border px-2 py-1 rounded w-full"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência Bancária">
                      Transferência Bancária
                    </option>
                  </select>
                ) : (
                  <p className="text-gray-800 font-semibold">
                    {alunoLocal.preferencia_pagamento}
                  </p>
                )}
              </div>

              {/* Dia de Cobrança */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">
                  Dia de Cobrança *
                </p>
                {modoEdicao ? (
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dadosEditados.dia_cobranca || ""}
                    onChange={(e) =>
                      handleInputChange("dia_cobranca", Number(e.target.value))
                    }
                    className="text-gray-800 font-semibold border px-2 py-1 rounded w-full"
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">
                    Dia {alunoLocal.dia_cobranca}
                  </p>
                )}
              </div>

              {/* Situação */}
              <div className="border-b pb-3 md:col-span-2">
                <p className="text-sm text-gray-500 font-medium">Situação</p>
                <span
                  onClick={handleToggleSituacao}
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                    alunoLocal.situacao
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {alunoLocal.situacao ? "Ativo" : "Inativo"}
                </span>
              </div>

              {/* Email */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500 font-medium">Email</p>
                {modoEdicao ? (
                  <input
                    type="email"
                    value={dadosEditados.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full"
                    placeholder="email@exemplo.com"
                  />
                ) : (
                  <div>
                    {alunoLocal.email?.length ? (
                      <p className="text-gray-800 font-semibold">
                        {alunoLocal.email}
                      </p>
                    ) : (
                      <p className="text-red-800 font-semibold">
                        Não informado
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Observação */}
              <div className="border-b pb-3 md:col-span-2">
                <p className="text-sm text-gray-500 font-medium">Observação</p>
                {modoEdicao ? (
                  <textarea
                    value={dadosEditados.observacao || ""}
                    onChange={(e) =>
                      handleInputChange("observacao", e.target.value)
                    }
                    className="text-gray-800 font-medium border px-2 py-1 rounded w-full min-h-[80px]"
                    placeholder="Observações sobre o aluno..."
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">
                    {alunoLocal.observacao || "Nenhuma observação"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer do Modal - Fixo */}
          <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
            {modoEdicao ? (
              <>
                <button
                  onClick={() => {
                    setModoEdicao(false);
                    setDadosEditados(alunoLocal);
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

      {/* Modal de Professores Associados */}
      {modalProfessoresAberto && (
        <ModalProfessoresAssociados
          alunoId={alunoLocal.id}
          alunoNome={alunoLocal.nome_completo}
          idiomas={idiomas}
          onClose={() => setModalProfessoresAberto(false)}
        />
      )}

      {/* Modal de Mensalidades */}
      {mostrarMensalidades && (
        <ModalMensalidade
          aluno={aluno}
          onClose={() => setMostrarMensalidades(false)}
        />
      )}
    </>
  );
}
