import { App } from "./server";
import { Publisher, initWorld } from "./simulation";

let stop: (err?: string) => void;

const buildSimulationHandler = async (publisher) => {
  stop = (await initWorld(publisher)).stop;

  return {
    handleEvent: async (name, payload) => {
      switch (name) {
        case "stop":
          stop();
          break;
        case "start":
          stop();
          stop = (await initWorld(publisher)).stop;
          break;
        default:
          console.log(`Unknown event: "${name}"`);
      }
    },
    stop,
  };
};

const app = new App(async (socket) => {
  const metricsPublisher: Publisher = {
    start: () => {
      socket.emit("start");
    },
    stop: () => {
      socket.emit("stop");
    },
    error: (err) => {
      socket.emit("error", { message: err });
    },
    metrics: (event: any) => {
      socket.emit("pool-metrics", event);
    },
  };
  return await buildSimulationHandler(metricsPublisher);
});

app.start();
