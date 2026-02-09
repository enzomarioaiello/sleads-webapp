/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SchemaResponse {
  schema: {
    tables: Record<
      string,
      {
        indexes: Array<{
          indexDescriptor: string;
          fields: string[];
        }>;
        validator: {
          kind: string;
          fields?: Record<string, any>;
          isOptional?: string;
        };
      }
    >;
  };
}

export interface TableInfo {
  name: string;
  indexes: Array<{
    indexDescriptor: string;
    fields: string[];
  }>;
  fields: Array<{
    name: string;
    type: string;
    optional: boolean;
    details?: any;
  }>;
}





