export type Display<T> = {
  [K in keyof T]: T[K] | string;
};

export interface IMetrics {
  timestamp: number;
  poolSize: number;
  poolUsed: number;
  poolAvailable: number;
  poolQueue: number;
  queriesCount: number;
  errorsCount: number;
  newConnectionsCount: number;
}
