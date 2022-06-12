import { Line } from "react-chartjs-2";
import { IMetrics } from "../metrics";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TimeSeriesScale,
  CategoryScale,
  ChartData,
  Filler,
} from "chart.js";
import { useEffect, useRef, useState } from "react";
import "chartjs-adapter-moment";

ChartJS.register(
  TimeScale,
  TimeSeriesScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const poolOptions = {
  responsive: true,
  aspectRatio: 2,
  animation: {
    easing: "linear" as const,
  },
  animations: {
    y: {
      duration: 0,
    },
  },
  scales: {
    x: {
      type: "time" as const,
      time: {
        unit: "minute" as const,
      },
    },
    y: {
      type: "linear" as const,
      beginAtZero: true,
    },
  },
  plugins: {
    legend: {
      position: "chartArea" as const,
    },
    title: {
      display: true,
      text: "Pool",
    },
  },
};

const commonDatasetOptions = {
  pointRadius: 0,
  stepped: true,
};

function PoolChart({
  timestamps,
  metrics,
}: {
  timestamps: number[];
  metrics: IMetrics;
}) {
}

export function PoolCharts({ metrics }: { metrics: IMetrics }) {
  const chartRef = useRef<ChartJS<"line">>(null);
  const [timestamps, setTimestamps] = useState<number[]>(new Array(160));
  const [poolData, setPoolData] = useState<ChartData<"line">>({
    labels: timestamps,
    datasets: [
      {
        ...commonDatasetOptions,
        label: "Queue",
        data: [],
        borderColor: "rgb(255, 99, 132)",
      },
      {
        ...commonDatasetOptions,
        label: "Used",
        data: [],
        fill: "start",
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
      {
        ...commonDatasetOptions,
        label: "Size",
        data: [],
        fill: "start",
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  });

  useEffect(() => {
    const now = Date.now();

    const len = timestamps.length;
    for (let i = 0; i < len; i++) {
      const deltaS: number = 500 * (len - i);

      timestamps[i] = now - deltaS;
    }
    setTimestamps(timestamps);

    for (let i = 0; i < len; i++) {
      poolData.datasets[0].data[i] = null;
      poolData.datasets[1].data[i] = null;
      poolData.datasets[2].data[i] = null;
    }

    setPoolData(poolData);
  }, []);

  useEffect(() => {
    if (!metrics) {
      return;
    }

    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    timestamps.shift();
    timestamps.push(metrics.timestamp);

    poolData.labels = timestamps;
    poolData.datasets[0].data.shift();
    poolData.datasets[1].data.shift();
    poolData.datasets[2].data.shift();
    poolData.datasets[0].data.push(metrics.poolQueue);
    poolData.datasets[1].data.push(metrics.poolUsed);
    poolData.datasets[2].data.push(metrics.poolSize);
    chart.update();
  }, [metrics]);

  if (!metrics) {
    return <></>;
  }

  return <Line ref={chartRef} options={poolOptions} data={poolData} />;
}
