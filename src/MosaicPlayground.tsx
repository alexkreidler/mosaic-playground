import { Box, Button, Center, Text, HStack, Heading, Link, Select, Spacer, Stack, useToast } from "@chakra-ui/react";
import { Icon } from "@iconify-icon/react";
import { DEFAULT_SPEC, MosaicPlot } from "./MosaicPlot.jsx";

import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";

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

export const MosaicPlayground = () => {
  const toast = useToast();
  const [parsedSpec, setParsedSpec] = useState(DEFAULT_SPEC);
  const [rawSpec, setRawSpec] = useState(JSON.stringify(DEFAULT_SPEC, null, 4));
  const examples = useAsync(getExampleSpecsFromGithub, []);
  // TODO: allow setting custom DuckDB rest/socket backend connection
  // const [useBackend, setUseBackend] = useState(false);
  useEffect(() => {
    let newParsed;
    try {
      newParsed = JSON.parse(rawSpec);
    } catch (e) {
      console.error(e);
      toast({ title: "JSON error: " + (e as Error).message, status: "error", isClosable: true });
    }
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

  return (
    <Stack h="100%" w="full" spacing={0}>
      <HStack p={4} justifyContent="center" borderBottom="1px solid" borderBottomColor="gray.200">
        <Heading fontSize="xl">Mosaic Playground</Heading>

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
      <HStack flexGrow={1} spacing={0}>
        <Box alignSelf="stretch" width="35vw" borderRight="1px solid #ccc">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={rawSpec}
            onChange={(v) => setRawSpec(v ?? "")}
          />
        </Box>
        <Box backgroundColor="gray.100" flexGrow={1} alignSelf="stretch">
          <Center h="full">
            <MosaicPlot spec={parsedSpec} />
          </Center>
        </Box>
      </HStack>
    </Stack>
  );
};
