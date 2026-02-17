export type ConnectionType = "postgres" | "mongo" | "redis";

export interface Connection {
  _id: string;
  type: ConnectionType;
  name: string;
  createdAt: string;
}
