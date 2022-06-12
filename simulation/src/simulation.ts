import { Pool } from "sequelize-pool";

let id = 1;

export interface Publisher {
  start(): void;
  stop(): void;
  metrics(metrics: any): void;
  error(err: string): void;
}

/**
 * Resumo:
 *   Esse script faz uma simulação de uso de um pool de conexões. A cada
 *   intervalo imprime um resumo do que está acontendo, com informações do
 *   pool e também do trabalho realizado até o momento (queries).
 *   A cada nova conexão aberta com o banco de dados existe a chance de dar erro
 *   e terminar a simulação.
 *
 *   A interpretação do quais métricas são interessantes e quais valores são
 *   mais desejáveis em cada métrica fica a cargo da leitora :)
 */

const MIN_POOL = parseInt(process.env.MIN_POOL || "10", 10);
const MAX_POOL = parseInt(process.env.MAX_POOL || "100", 10);

async function sleep(durationInMiliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationInMiliseconds));
}

/**
 * Imitação de conexão com o banco de dados.
 *
 * Permite fazer todas as conexões iniciais mas depois cada conexão nova tem
 * chance de dar erro.
 */
class ConnectionManager {
  public totalConnections = 0;

  async create(): Promise<Connection> {
    this.totalConnections += 1;
    const id = this.totalConnections;
    const duration = Math.random() * 1000;
    await sleep(duration);

    if (this.totalConnections > MAX_POOL && duration > 500) {
      throw new Error("failed to connect");
    }

    return new Connection(id);
  }
}

class Connection {
  constructor(readonly id: number) {
    this.id = id;
  }

  destroy(): void {
    return;
  }

  validate(): boolean {
    return true;
  }
}

/**
 * Classe para consumir o banco de dados.
 *
 * Executa as queries com uma duração variável para
 */
class Repository {
  private _queryCount = 0;

  constructor(private pool: Pool<Connection>) {}

  public get queryCount(): number {
    return this._queryCount;
  }

  async executeQuery(): Promise<void> {
    const conn = await this.pool.acquire();

    const duration = 1000 + Math.random() * 2000;
    await sleep(duration);

    this._queryCount += 1;
    this.pool.release(conn);
  }
}

class Simulation {
  private running = true;
  private repository: Repository;
  private _errorCount: number = 0;
  readonly id: number;

  get errorCount(): number {
    return this._errorCount;
  }

  constructor({ repository }: { repository: Repository }) {
    this.id = id;
    id += 1;
    this.repository = repository;
  }

  stop(): void {
    this.running = false;
  }

  async parallelQueries(noQueries: number): Promise<unknown> {
    const queries = Array(Math.ceil(noQueries))
      .fill(null)
      .map(async () => this.repository.executeQuery());
    return Promise.all(queries).catch(() => {
      this._errorCount += 1;
      throw new Error("operation failed");
    });
  }

  /**
   * Função simulando uso do serviço.
   *
   * Tem uma lógica simples para tentar manter o serviço sempre em uso.
   * Cada vez que a função roda existe uma chance alta de ter algum trabalho
   * para fazer, e quando isso acontece a função agenda uma nova tentativa
   * no futuro.
   */
  async doSomething(): Promise<void> {
    if (!this.running) {
      return;
    }

    await sleep(500);

    const random = Math.floor(1 + Math.random() * 10);
    switch (random) {
      /**
       * Simulando uma chamada que gera um pico de queries,
       * mas assume que o valor MAX_POOL foi ajustado para esse cenário.
       */
      case 1:
      case 2:
        await this.parallelQueries(MAX_POOL / 5);

        await this.doSomething();
        break;
      /**
       * Simulando uso constante do serviço com uma carga moderada.
       */
      case 3:
      case 4:
        await this.parallelQueries(MIN_POOL / 2);

        await this.doSomething();
      /**
       * Simulando carga baixa no serviço para deixar agendadas novas
       * operações no futuro.
       */
      case 5:
      case 6:
      case 7:
        await this.parallelQueries(2);

        await this.doSomething();
        break;
      default:
        break;
    }
  }
}

export async function initWorld(publisher: Publisher) {
  let stop: (err?: string) => void;
  const connectionManager = new ConnectionManager();
  const createConnection = async () => {
    return connectionManager.create().catch((err) => {
      throw err;
    });
  };
  const pool = new Pool({
    name: "connection-poool",
    create: createConnection,
    destroy: (conn) => conn.destroy(),
    validate: (conn) => conn.validate(),
    min: MIN_POOL,
    max: MAX_POOL,
    log: false,
    idleTimeoutMillis: 2000,
    reapIntervalMillis: 500,
  });
  const repository = new Repository(pool);
  const simulation = new Simulation({ repository });
  console.log(`[Simulation][${simulation.id}] Starting`);
  publisher.start();
  const timers: NodeJS.Timer[] = [];
  stop = (err) => {
    simulation.stop();
    publisher.stop();
    timers.forEach((timer) => clearInterval(timer));
    if (err) {
      publisher.error(err);
    }
    console.log(`[Simulation][${simulation.id}] Stopped`);
  };

  /** Carga inicial */
  for (let i = 0; i <= MAX_POOL / 5; i++) {
    simulation.doSomething().catch((err) => publisher.error(err.message));
  }

  /** Caso o RNG conspire contra a simulação tenta dar uma reanimada */
  timers.push(
    setInterval(() => {
      if (pool.using === 0) {
        simulation.doSomething().catch((err) => publisher.error(err.message));
      }
    }, 500)
  );

  timers.push(
    setInterval(() => {
      const table = {
        timestamp: Date.now(),
        poolSize: pool.size,
        poolUsed: pool.using,
        poolAvailable: pool.available,
        poolQueue: pool.waiting,
        queriesCount: repository.queryCount,
        errorsCount: simulation.errorCount,
        newConnectionsCount: Math.max(
          connectionManager.totalConnections - MAX_POOL,
          0
        ),
      };
      publisher.metrics(table);
    }, 500)
  );

  return {
    stop,
  };
}
