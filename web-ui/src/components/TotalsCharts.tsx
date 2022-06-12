
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

const totalsOptions = {
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
      min: 0,
    },
  },
  plugins: {
    legend: {
      position: "chartArea" as const,
    },
    title: {
      display: true,
      text: "Totals",
    },
  },
};

const commonDatasetOptions = {
  pointRadius: 0,
  stepped: true,
};

export function TotalsCharts({ metrics }: { metrics: IMetrics }) {
  const chartRef = useRef<ChartJS<"line">>(null);
  const [timestamps, setTimestamps] = useState<number[]>(new Array(160));
  const [totalsData, setTotalsData] = useState<ChartData<"line">>({
    labels: timestamps,
    datasets: [
      {
        ...commonDatasetOptions,
        label: "Queries",
        data: [],
        borderColor: "rgb(255, 99, 132)",
      },
      {
        ...commonDatasetOptions,
        label: "New conn.",
        data: [],
        borderColor: "rgb(53, 162, 235)",
      },
      {
        ...commonDatasetOptions,
        label: "Errors",
        data: [],
        borderColor: "rgb(75, 192, 192)",
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
      totalsData.datasets[0].data[i] = null;
      totalsData.datasets[1].data[i] = null;
      totalsData.datasets[2].data[i] = null;
    }

    setTotalsData(totalsData);
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

    totalsData.labels = timestamps;
    totalsData.datasets[0].data.shift();
    totalsData.datasets[1].data.shift();
    totalsData.datasets[2].data.shift();
    totalsData.datasets[0].data.push(metrics.queriesCount);
    totalsData.datasets[1].data.push(metrics.newConnectionsCount);
    totalsData.datasets[2].data.push(metrics.errorsCount);
    chart.update();
  }, [metrics]);

  if (!metrics) {
    return <></>;
  }

  return <Line ref={chartRef} options={totalsOptions} data={totalsData} />;
}
