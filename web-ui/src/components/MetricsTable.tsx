import moment from 'moment';
import { Display, IMetrics } from "../metrics";

function displayMetrics(metrics?: IMetrics): Display<IMetrics> {
  return {
    timestamp: moment(metrics?.timestamp).format("HH:mm:ss"),
    poolSize: metrics?.poolSize ?? "-",
    poolUsed: metrics?.poolUsed ?? "-",
    poolAvailable: metrics?.poolAvailable ?? "-",
    poolQueue: metrics?.poolQueue ?? "-",
    queriesCount: metrics?.queriesCount ?? "-",
    errorsCount: metrics?.errorsCount ?? "-",
    newConnectionsCount: metrics?.newConnectionsCount ?? "-",
  };
}

export function MetricsTable({ metrics }: { metrics?: IMetrics }) {
  const tableData = displayMetrics(metrics);

  return (
    <table className="table-auto border-2 border-slate-800 min-w-fit">
      <tbody>
        {[
          ["Timestamp", tableData.timestamp],
          ["[Pool] Tamanho", tableData.poolSize],
          ["[Pool] Em uso", tableData.poolUsed],
          ["[Pool] Disponíveis", tableData.poolAvailable],
          ["[Pool] Fila", tableData.poolQueue],
          ["[Queries] Total", tableData.queriesCount],
          ["[Erros] Total", tableData.errorsCount],
          ["Novas conexões", tableData.newConnectionsCount],
        ].map(([label, value]) => (
          <tr
            key={label}
            className="odd:bg-gray-300 even:bg-white hover:bg-yellow-200"
          >
            <td className="px-2">{label}</td>
            <td className="px-2 border-x border-slate-800">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
