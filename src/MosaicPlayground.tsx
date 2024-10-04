import { Box, Button, Center, Text, HStack, Heading, Link, Select, Spacer, Stack, Checkbox, useDisclosure } from "@chakra-ui/react";
import { Icon } from "@iconify-icon/react";
import { DEFAULT_SPEC, MosaicContext, MosaicPlot } from "./MosaicPlot.jsx";

import { useContext, useEffect, useState } from "react";
import { useAsync } from "react-async-hook";
import { Allotment } from "allotment";
import { parse, stringify } from "yaml";
import "allotment/dist/style.css";
import { downloadBlob } from "./exportChart.js";
import { snakeCase } from "change-case";
import { QueryLogsTable, QueryLog } from "./QueryLogsTable.js";
import { MosaicEditor, SpecFormat } from "./MosaicEditor.js";
import UploadData from "./UploadData.js";


export async function getExampleSpecsFromGithub(format: SpecFormat): Promise<{ name: string; url: string }[]> {
  const metaURL = "https://api.github.com/repos/uwdata/mosaic/contents/specs/" + format;
  const res = await fetch(metaURL);
  const specs = await res.json();
  const examples = specs.map((s: any) => ({
    name: s.name.replace(".json", "").replace(".yaml", ""),
    url: s.download_url,
  }));
  return examples;
}

export const MosaicPlayground = () => {
  const mosaic = useContext(MosaicContext);
  const [parsedSpec, setParsedSpec] = useState(DEFAULT_SPEC);
  const [rawSpec, setRawSpec] = useState(JSON.stringify(DEFAULT_SPEC, null, 4));
  const [specFormat, setSpecFormat] = useState<SpecFormat>("json");
  const examples = useAsync(getExampleSpecsFromGithub, [specFormat]);
  // TODO: allow setting custom DuckDB rest/socket backend connection
  // const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    let newParsed;
    try {
      newParsed = specFormat == "json" ? JSON.parse(rawSpec) : parse(rawSpec);
    } catch (e) { }
    if (newParsed) {
      setParsedSpec(newParsed);
    }
  }, [rawSpec]);

  // Note we still rely on DEFAULT_SPEC which we have manually kept as the line example
  const [exampleValue, setExampleValue] = useState("line");
  async function loadExample(name: string) {
    const ex = examples.result?.find((e) => e.name === name);
    if (!ex) return;
    const spec = await (await fetch(ex.url)).text();
    setRawSpec(spec);
  }

  function changeSpecFormat(value: SpecFormat) {
    const newRawSpec = value === "json" ? JSON.stringify(parsedSpec, null, 4) : stringify(parsedSpec, { indent: 4 });
    setSpecFormat(value);
    setRawSpec(newRawSpec);
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
    // TODO: handle uncaught errors like Error: Binder Error: Referenced column "b" not found in FROM clause!
  };
  const disclosure = useDisclosure();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const uploadButtonContent = {
    'idle': (
      <Button
        variant="outline"
        leftIcon={<Icon icon="fluent:arrow-up-24-filled" />}
        onClick={disclosure.onOpen}
      >
        Upload Data
      </Button>
    ),
    'loading': (
      <Button
        variant="outline"
        isLoading
        loadingText='Loading Data'
      >
      </Button>
    ),
    'done': (
      <Button
        variant="outline"
        leftIcon={<Icon icon="fluent:checkmark-24-filled" />}
        disabled
      >
        Done
      </Button>
    )
  };

  if (mosaic?.coordinator) {
    // @ts-ignore
    mosaic.coordinator.manager.logQueries(true);
    // @ts-ignore
    mosaic.coordinator.manager.logger(queryLogger);
  }

  return (
    <Stack h="100%" w="full" spacing={0}>
      <HStack p={4} justifyContent="center" borderBottom="1px solid" borderBottomColor="gray.200" spacing={3}>
        <Stack spacing={0}>
          <Heading fontSize="xl">Mosaic Playground</Heading>
          <Link href="https://github.com/alexkreidler/mosaic-playground" target="_blank">
            <Text fontSize="sm" color="gray.500">
              view source on Github
            </Text>
          </Link>
        </Stack>
        {/* <HStack>
          <Image src="/mosaic.svg" height="22px" mt={-2} />
          <Heading fontSize="xl">playground</Heading>
        </HStack> */}
        <Spacer />
        {uploadButtonContent[uploadStatus]}
        <UploadData disclosure={disclosure} setUploadStatus={setUploadStatus} />
        <Button
          variant="outline"
          leftIcon={<Icon icon="fluent:arrow-download-24-filled" />}
          onClick={() => {
            downloadBlob(
              new Blob([rawSpec], { type: specFormat == "json" ? "application/json" : "application/yaml" }),
              (parsedSpec.meta?.title ? snakeCase(parsedSpec.meta?.title) : "mosaic-spec") +
              (specFormat == "json" ? ".json" : ".yaml")
            );
          }}
        >
          Download Spec
        </Button>
        <HStack>
          <Text fontSize="sm" fontWeight="medium">
            Spec Format:
          </Text>
          <Select
            value={specFormat}
            size="sm"
            w="fit-content"
            onChange={(e) => {
              changeSpecFormat(e.target.value as SpecFormat);
            }}
          >
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </Select>
        </HStack>
        <HStack>
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
        </HStack>
        <HStack>
          {/* TODO: change order so label goes first */}
          <Checkbox
            isChecked={showLogs}
            onChange={(e) => setShowLogs(e.target.checked)}
            sx={{ fontSize: "sm", fontWeight: "medium" }}
          >
            Show Query Logs
          </Checkbox>
        </HStack>
        <Button
          variant="outline"
          leftIcon={<Icon icon="ion:book-outline" />}
          as={Link}
          href="https://idl.uw.edu/mosaic/"
          target="_blank"
        >
          Mosaic Docs
        </Button>
        <Button
          variant="outline"
          leftIcon={<Icon icon="fa:github" />}
          as={Link}
          href="https://github.com/uwdata/mosaic"
          target="_blank"
        >
          Github
        </Button>
      </HStack>
      <Allotment>
        <Allotment.Pane preferredSize="30%">
          <MosaicEditor specFormat={specFormat} rawSpec={rawSpec} setRawSpec={setRawSpec} parsedSpec={parsedSpec} />
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

