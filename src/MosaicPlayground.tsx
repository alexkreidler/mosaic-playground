import {
  Box,
  Button,
  Center,
  Text,
  HStack,
  Heading,
  Link,
  Select,
  Spacer,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Checkbox,
} from "@chakra-ui/react";
import { Icon } from "@iconify-icon/react";
import { DEFAULT_SPEC, MosaicContext, MosaicPlot } from "./MosaicPlot.jsx";

import Editor from "@monaco-editor/react";
import { useContext, useEffect, useState } from "react";
import { useAsync } from "react-async-hook";
import { format } from "date-fns";
import "allotment/dist/style.css";
import { Allotment } from "allotment";
import { KeyCode, KeyMod, type languages } from "monaco-editor";
import * as monaco from "monaco-editor";

const JSON_SCHEMA_URL = "https://raw.githubusercontent.com/uwdata/mosaic/main/docs/public/schema/v0.11.0.json";
function getSchemas(): languages.json.LanguageServiceDefaults["diagnosticsOptions"] {
  return {
    enableSchemaRequest: true,
    schemas: [
      {
        uri: JSON_SCHEMA_URL,
        fileMatch: ["*"],
        // TODO: investigate whether better to bundle schema instead of load from Github
        // schema: jsonSchema,
      },
    ],
  };
}

export async function getExampleSpecsFromGithub(): Promise<{ name: string; url: string }[]> {
  const metaURL = "https://api.github.com/repos/uwdata/mosaic/contents/specs/json";
  const res = await fetch(metaURL);
  const specs = await res.json();
  const examples = specs.map((s: any) => ({
    name: s.name.replace(".json", ""),
    url: s.download_url,
  }));
  return examples;
}

interface QueryLog {
  type: string;
  sql: string;
  time: Date;
}

export const MosaicPlayground = () => {
  const mosaic = useContext(MosaicContext);
  const [parsedSpec, setParsedSpec] = useState(DEFAULT_SPEC);
  const [rawSpec, setRawSpec] = useState(JSON.stringify(DEFAULT_SPEC, null, 4));
  const examples = useAsync(getExampleSpecsFromGithub, []);
  // TODO: allow setting custom DuckDB rest/socket backend connection
  // const [useBackend, setUseBackend] = useState(false);
  useEffect(() => {
    let newParsed;
    try {
      newParsed = JSON.parse(rawSpec);
    } catch (e) {}
    if (newParsed) {
      setParsedSpec(newParsed);
    }
  }, [rawSpec]);

  // Note we still rely on DEFAULT_SPEC which we have manually kept as the line example
  const [exampleValue, setExampleValue] = useState("line");
  async function loadExample(name: string) {
    const ex = examples.result?.find((e) => e.name === name);
    if (!ex) return;
    const spec = await (await fetch(ex.url)).json();
    setRawSpec(JSON.stringify(spec, null, 4));
  }
  const [showLogs, setShowLogs] = useState(true);

  const [logs, setLogs] = useState<QueryLog[]>([]);
  const queryLogger = {
    ...console,
    debug(...values: any[]) {
      if (values.length > 0 && typeof values[0] === "string" && values[0].includes("Query")) {
        setLogs((l) => [...l, { ...(values[1] as QueryLog), time: new Date() }]);
      }
      console.debug(...values);
    },
    // error(...values: any[]) {
    //   // TODO: handle uncaught errors like Error: Binder Error: Referenced column "b" not found in FROM clause!
    //   if (values.length > 0 && typeof values[0] === "string" && values[0].includes("Uncaught")) {
    //     console.log("UNCAUGHT", ...values)
    //   }
    // }
  };

  if (mosaic?.coordinator) {
    // @ts-ignore
    mosaic.coordinator.manager.logQueries(true);
    // @ts-ignore
    mosaic.coordinator.manager.logger(queryLogger);
  }

  return (
    <Stack h="100%" w="full" spacing={0}>
      <HStack p={4} justifyContent="center" borderBottom="1px solid" borderBottomColor="gray.200">
        <Heading fontSize="xl">Mosaic Playground</Heading>
        {/* <HStack>
          <Image src="/mosaic.svg" height="22px" mt={-2} />
          <Heading fontSize="xl">playground</Heading>
        </HStack> */}
        <Spacer />
        <Text fontSize="sm" fontWeight="medium">
          Example Spec:
        </Text>
        <Select
          value={exampleValue}
          size="sm"
          w="fit-content"
          onChange={(e) => {
            loadExample(e.target.value);
            setExampleValue(e.target.value);
          }}
        >
          {examples.result?.map((e) => (
            <option key={e.name} value={e.name}>
              {e.name}
            </option>
          ))}
        </Select>
        <Checkbox isChecked={showLogs} onChange={(e) => setShowLogs(e.target.checked)}>
          Show Query Logs
        </Checkbox>
        <Button
          variant="outline"
          leftIcon={<Icon icon="fa:github" />}
          as={Link}
          href="https://github.com/uwdata/mosaic"
          target="_blank"
        >
          Github
        </Button>
        <Button
          variant="outline"
          leftIcon={<Icon icon="ion:book-outline" />}
          as={Link}
          href="https://idl.uw.edu/mosaic/"
          target="_blank"
        >
          Docs
        </Button>
      </HStack>
      <Allotment>
        <Allotment.Pane preferredSize="30%">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={rawSpec}
            onChange={(v) => setRawSpec(v ?? "")}
            beforeMount={(monaco) => {
              monaco.languages.json.jsonDefaults.setDiagnosticsOptions(getSchemas());
            }}
            onMount={(editor, monaco) => {
              const addJSONSchema: monaco.editor.IActionDescriptor = {
                id: "add-json-schema",
                label: "Add JSON Schema for Mosaic ($schema key)",
                contextMenuOrder: 0,
                contextMenuGroupId: "1_modification",
                keybindings: [KeyMod.CtrlCmd | KeyCode.KeyM],
                run: () => {
                  setRawSpec(JSON.stringify({ $schema: JSON_SCHEMA_URL, ...parsedSpec }, null, 4));
                },
              };
              editor.addAction(addJSONSchema);
            }}
          />
        </Allotment.Pane>
        <Box backgroundColor="gray.100" h="full">
          <Center h="full">
            <MosaicPlot spec={parsedSpec} />
          </Center>
        </Box>

        <Allotment.Pane preferredSize="25%" className="overflow-y-scroll" snap={true} visible={showLogs}>
          <Box p={2}>
            <QueryLogsTable logs={logs} />
          </Box>
        </Allotment.Pane>
      </Allotment>
    </Stack>
  );
};

function QueryLogsTable({ logs }: { logs: QueryLog[] }) {
  return (
    <Table variant="simple" size="sm">
      <Thead>
        <Tr>
          <Th>Timestamp</Th>
          <Th>Query</Th>
          {/* <Th>Type</Th> */}
        </Tr>
      </Thead>
      <Tbody>
        {logs.map((log, index) => (
          <Tr key={index}>
            <Td>{format(log.time, "h:m:mss")}</Td>
            <Td>{log.sql}</Td>
            {/* <Td>{log.type}</Td> */}
          </Tr>
        ))}
        {/* TODO: autoscroll to bottom/highlight new queries */}
      </Tbody>
    </Table>
  );
}
