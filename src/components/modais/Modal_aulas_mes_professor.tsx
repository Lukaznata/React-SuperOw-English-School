// filepath: c:\Projetos em Python\Superow\frontend\src\components\modais\Modal_aulas_mes_professor.tsx
import { useState, useEffect, useRef } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Professor {
  id: number;
  nome_completo: string;
  foto_perfil: string;
}

interface Aluno {
  id: number;
  nome_completo: string;
}

interface AulaDetalhada {
  id: number;
  data_aula: string;
  valor_professor: number;
  alunos: Aluno[];
}

interface ModalAulasMesProfessorProps {
  professor: Professor;
  mes: number;
  ano: number;
  onClose: () => void;
}

export default function ModalAulasMesProfessor({
  professor,
  mes,
  ano,
  onClose,
}: ModalAulasMesProfessorProps) {
  const toast = useToast();
  const mouseDownInsideModal = useRef(false);
  const [aulas, setAulas] = useState<AulaDetalhada[]>([]);
  const [carregando, setCarregando] = useState(true);

  const nomesMeses = [
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

  // Carregar aulas do professor no mês
  const carregarAulas = async () => {
    setCarregando(true);
    try {
      const response = await api.get("/aulas");
      const todasAulas = response.data.items || response.data || [];

      // Filtrar aulas do professor no mês específico
      const aulasFiltradas = todasAulas.filter((aula: any) => {
        if (aula.professor_id !== professor.id) return false;

        const dataAula = parseDataAula(aula.data_aula);
        if (!dataAula) return false;

        return dataAula.getMonth() === mes && dataAula.getFullYear() === ano;
      });

      // Carregar alunos de cada aula
      const aulasComAlunos = await Promise.all(
        aulasFiltradas.map(async (aula: any) => {
          try {
            const resAlunos = await api.get(`/aulas/${aula.id}/alunos`);
            return {
              ...aula,
              alunos: resAlunos.data || [],
            };
          } catch (err) {
            console.error("Erro ao carregar alunos da aula:", err);
            return {
              ...aula,
              alunos: [],
            };
          }
        })
      );

      // Ordenar por data
      aulasComAlunos.sort((a, b) => {
        const dataA = parseDataAula(a.data_aula);
        const dataB = parseDataAula(b.data_aula);
        if (!dataA || !dataB) return 0;
        return dataA.getTime() - dataB.getTime();
      });

      setAulas(aulasComAlunos);
    } catch (err) {
      console.error("Erro ao carregar aulas:", err);
      toast.error("Erro ao carregar aulas.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAulas();
  }, []);

  // Parse de data
  const parseDataAula = (dataStr: string): Date | null => {
    try {
      const [datePart, timePart] = dataStr.split(" ");
      const [dia, mesStr, anoStr] = datePart.split("/");
      const [hora, minuto] = timePart.split(":");

      return new Date(
        parseInt(anoStr),
        parseInt(mesStr) - 1,
        parseInt(dia),
        parseInt(hora),
        parseInt(minuto)
      );
    } catch {
      return null;
    }
  };

  // Formatar data e hora
  const formatarDataHora = (dataStr: string): string => {
    const data = parseDataAula(dataStr);
    if (!data) return dataStr;

    const dia = data.getDate().toString().padStart(2, "0");
    const mesFormat = (data.getMonth() + 1).toString().padStart(2, "0");
    const hora = data.getHours().toString().padStart(2, "0");
    const minuto = data.getMinutes().toString().padStart(2, "0");

    return `${dia}/${mesFormat}/${data.getFullYear()} às ${hora}:${minuto}`;
  };

  // Calcular total
  const calcularTotal = (): number => {
    return aulas.reduce(
      (sum, aula) => sum + (Number(aula.valor_professor) || 0),
      0
    );
  };

  // Exportar para PDF
  const exportarPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text(`Relatório de Aulas - ${professor.nome_completo}`, 14, 15);

    doc.setFontSize(12);
    doc.text(`Total de aulas em ${nomesMeses[mes]}/${ano}`, 14, 25);

    // Preparar dados da tabela
    const tableData = aulas.map((aula) => {
      const dataFormatada = formatarDataHora(aula.data_aula);
      const valor = `R$ ${(Number(aula.valor_professor) || 0).toFixed(2)}`;
      const alunos =
        aula.alunos.length > 0
          ? aula.alunos.map((a) => a.nome_completo).join(", ")
          : "Sem alunos";
      const status = aulaJaOcorreu(aula.data_aula) ? "Realizada" : "Pendente";

      return [dataFormatada, valor, alunos, status];
    });

    // Gerar tabela
    autoTable(doc, {
      startY: 35,
      head: [["Data e Hora", "Valor", "Alunos", "Status"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [26, 71, 47],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      didParseCell: (data) => {
        // Colorir linhas baseado no status
        if (data.section === "body" && data.column.index === 3) {
          const rowData = tableData[data.row.index];
          const status = rowData[3];

          if (status === "Realizada") {
            data.row.cells[0].styles.fillColor = [220, 252, 231]; // Verde claro
            data.row.cells[1].styles.fillColor = [220, 252, 231];
            data.row.cells[2].styles.fillColor = [220, 252, 231];
            data.row.cells[3].styles.fillColor = [220, 252, 231];
            data.row.cells[3].styles.textColor = [22, 101, 52]; // Verde escuro
          } else {
            data.row.cells[0].styles.fillColor = [254, 249, 195]; // Amarelo claro
            data.row.cells[1].styles.fillColor = [254, 249, 195];
            data.row.cells[2].styles.fillColor = [254, 249, 195];
            data.row.cells[3].styles.fillColor = [254, 249, 195];
            data.row.cells[3].styles.textColor = [161, 98, 7]; // Amarelo escuro
          }
        }
      },
      foot: [
        [
          {
            content: "Total:",
            colSpan: 3,
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: `R$ ${calcularTotal().toFixed(2)}`,
            styles: { fontStyle: "bold" },
          },
        ],
      ],
      footStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontSize: 11,
        fontStyle: "bold",
      },
    });

    // Salvar
    const nomeArquivo = `aulas_${professor.nome_completo.replace(
      /\s+/g,
      "_"
    )}_${nomesMeses[mes]}_${ano}.pdf`;
    doc.save(nomeArquivo);

    toast.success("PDF gerado com sucesso!");
  };

  // Verificar se aula já ocorreu
  const aulaJaOcorreu = (dataAulaStr: string) => {
    const dataAula = parseDataAula(dataAulaStr);
    if (!dataAula) return false;
    const agora = new Date();
    return dataAula < agora;
  };

  // Handlers de modal
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[96vh] overflow-hidden flex flex-col"
        onMouseDown={handleModalMouseDown}
      >
        {/* Header */}
        <div className="bg-[#1a472f] text-white p-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">{professor.nome_completo}</h2>
          <p className="text-gray-300 text-sm mt-1">
            Total de aulas em {nomesMeses[mes]}/{ano}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto flex-1">
          {carregando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : aulas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma aula encontrada neste mês
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">
                      Data e Hora
                    </th>
                    <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">
                      Valor Professor
                    </th>
                    <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">
                      Alunos
                    </th>
                    <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {aulas.map((aula) => (
                    <tr
                      key={aula.id}
                      className={`${
                        aulaJaOcorreu(aula.data_aula)
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } transition-colors`}
                    >
                      <td className="border border-gray-300 p-3">
                        {formatarDataHora(aula.data_aula)}
                      </td>
                      <td className="border border-gray-300 p-3 font-semibold text-green-600">
                        R$ {(Number(aula.valor_professor) || 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-3">
                        {aula.alunos.length === 0 ? (
                          <span className="text-gray-400 text-sm italic">
                            Sem alunos
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {aula.alunos.map((aluno) => (
                              <span
                                key={aluno.id}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {aluno.nome_completo}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            aulaJaOcorreu(aula.data_aula)
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {aulaJaOcorreu(aula.data_aula)
                            ? "Realizada"
                            : "Pendente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-200">
                    <td
                      colSpan={4}
                      className="border border-gray-300 p-4 text-right"
                    >
                      <span className="text-lg font-bold text-gray-800">
                        Total: R$ {calcularTotal().toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex-shrink-0 flex justify-between items-center border-t">
          <div className="text-sm text-gray-600">
            {aulas.length} {aulas.length === 1 ? "aula" : "aulas"} no período
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportarPDF}
              disabled={aulas.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Baixar PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
