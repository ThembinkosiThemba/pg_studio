export type ConnectionType = "postgres" | "mongo";

export interface Connection {
  _id: string;
  type: ConnectionType;
  name: string;
  createdAt: string;
}
