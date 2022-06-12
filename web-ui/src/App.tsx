import { useSocket, useSocketEvent } from "socket.io-react-hook";
import { useEffect } from "react";
import { PoolCharts, MetricsTable, TotalsCharts } from "./components";
import { IMetrics } from "./metrics";

function App() {
  const { socket, error } = useSocket();
  const { lastMessage: lastMetrics } = useSocketEvent<IMetrics>(
    socket,
    "pool-metrics"
  );

  useEffect(() => {
    socket.emit("start");
  }, []);

  return (
    <div className="flex p-4">
      <div className="flex-auto w-full h-screen p-2 xl:w-5/6">
        <div className="grid grid-cols-2">
          <div className="col-span-1 border-2 border-slate-200 mx-1">
            <PoolCharts metrics={lastMetrics} />
          </div>
          <div className="col-span-1 border-2 border-slate-200 mx-1">
            <TotalsCharts metrics={lastMetrics} />
          </div>
        </div>
      </div>
      <div className="flex-auto w-0 invisible p-2 xl:visible xl:w-1/6">
        <MetricsTable metrics={lastMetrics} />
        {error ? (
          <div>
            Erro <p>{JSON.stringify(error)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
