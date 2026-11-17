declare module 'pg' {
  export interface ClientConfig {
    connectionString?: string;
    connectionTimeoutMillis?: number;
    ssl?: boolean | Record<string, unknown>;
  }

  export interface QueryResult<R = Record<string, unknown>> {
    rows: R[];
    rowCount: number | null;
  }

  export class Client {
    constructor(config?: ClientConfig);
    on(event: 'error', listener: (err: Error) => void): this;
    connect(): Promise<void>;
    query<R = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }
}
