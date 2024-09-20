import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr
} from "@chakra-ui/react";
import { format } from "date-fns";

export interface QueryLog {
  type: string;
  sql: string;
  time: Date;
}

export function QueryLogsTable({ logs }: { logs: QueryLog[]; }) {
  return (
    <Table variant="simple" size="sm">
      <Thead>
        <Tr>
          <Th>Timestamp</Th>
          <Th>Query</Th>
        </Tr>
      </Thead>
      <Tbody>
        {logs.map((log, index) => (
          <Tr key={index}>
            <Td>{format(log.time, "h:mm:ss")}</Td>
            <Td>{log.sql}</Td>
          </Tr>
        ))}
        {/* TODO: autoscroll to bottom/highlight new queries */}
      </Tbody>
    </Table>
  );
}
