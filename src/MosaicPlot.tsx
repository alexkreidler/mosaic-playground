// @ts-ignore
import * as vg from "@uwdata/vgplot";
// TODO: add types for vgplot
// @ts-ignore
import { createAPIContext } from "@uwdata/vgplot";
import { Coordinator } from "@uwdata/mosaic-core";

import React, { PropsWithChildren, useContext, useEffect, useRef } from "react";

import { parseSpec, astToDOM, Spec } from "@uwdata/mosaic-spec";
import { useAsync } from "react-async-hook";
import { Box, Heading, Text, useToast, HStack, Spacer, Stack, Tooltip } from "@chakra-ui/react";
import { LoadingSpinner } from "@saas-ui/react";
import { PlotAttributes } from "@uwdata/mosaic-spec/dist/types/spec/PlotAttribute";
import { Meta } from "@uwdata/mosaic-spec/dist/types/spec/Spec";
import { ExportMenu } from "./ExportMenu";

export const DEFAULT_SPEC: Spec = {
  data: {
    aapl: {
      file: "data/stocks.parquet",
      where: "Symbol = 'AAPL'",
    },
  },
  plot: [
    {
      mark: "lineY",
      data: {
        from: "aapl",
      },
      x: "Date",
      y: "Close",
    },
  ],
  width: 680,
  height: 200,
};

const DEFAULT_ATTRIBUTES: PlotAttributes = {
  xLabelAnchor: "center",
  xLabelArrow: "none",
  yLabelAnchor: "center",
  yLabelArrow: "none",

  rRange: [0, 18],
  // colorScale
  // "xLabel":"Count",
  // width: 640,
  // height: 200,
  style: {
    // fill: "#4c78a8",
    fontFamily: "Inter",
    // TODO: try to make axis label bold
    // 'g[aria-label="x-axis label"] text': {
    //   fontWeight: "bold",
    // },
    // 'g[aria-label="y-axis label"] text': {
    //   fontWeight: "bold",
    // },
  },
};

interface MosaicContextValue {
  coordinator: Coordinator;
  api: any;
}

interface WithSchema {
  $schema?: string;
}

export type NicePlot = Spec & WithSchema;

export const MosaicContext = React.createContext<MosaicContextValue | null>(null);

export const MosaicProvider: React.FC<PropsWithChildren<{ remote?: boolean }>> = ({ children, remote = false }) => {
  const coordinator = vg.coordinator();
  const connector = remote ? vg.socketConnector("ws://localhost:3000") : vg.wasmConnector();
  coordinator.databaseConnector(connector);

  const api = React.useMemo(() => createAPIContext({ coordinator }), []);
  const value = { coordinator, api };
  // @ts-ignore
  window.MOSAIC = value;

  return <MosaicContext.Provider value={value}>{children}</MosaicContext.Provider>;
};

const Container: React.FC<{ child: HTMLElement | SVGSVGElement }> = ({ child }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && child) {
      ref.current.appendChild(child as Node);
    }
    return () => {
      if (ref.current && child) {
        ref.current.removeChild(child as Node);
      }
    };
  }, [child]);
  return <div ref={ref}></div>;
};

export const SimpleChart = ({ element, meta }: { element: HTMLElement | SVGSVGElement; meta: Meta }) => {
  return (
    <Stack bgColor="white" p={4} px={6} borderRadius="md" w="fit-content" spacing={4}>
      <HStack>
        <Stack>
          {meta.title ? (
            <Heading size="lg">{meta.title}</Heading>
          ) : (
            <Tooltip label="Use the meta.title and meta.description keys in the JSON spec to add details">
              <Heading>Untitled Chart</Heading>
            </Tooltip>
          )}
          {meta.description ? <Text>{meta.description}</Text> : null}
        </Stack>
        <Spacer />
        <ExportMenu element={element} meta={meta} />
      </HStack>
      <Container child={element} />

      {meta.credit ? <Text>{meta.credit}</Text> : null}
    </Stack>
  );
};

export const MosaicPlot = ({ spec }: { spec: NicePlot } = { spec: DEFAULT_SPEC }) => {
  const mc = useContext(MosaicContext);
  const toast = useToast();
  const chart = useAsync(async () => {
    try {
      if (!mc?.coordinator) {
        console.warn("No coordinator");

        return;
      }

      // @ts-ignore
      let newSpec: Spec = {
        ...DEFAULT_ATTRIBUTES,
        ...spec,
      };
      delete newSpec["$schema"];
      if (newSpec.data) {
        for (const [k, v] of Object.entries(newSpec.data!)) {
          if (v.file && v.file.startsWith("data/")) {
            newSpec.data![k] = { ...v, file: `https://raw.githack.com/uwdata/mosaic/main/${v.file}` };
          }
        }
      }
      let meta = newSpec.meta;

      const ast = parseSpec(newSpec);
      try {
        //Plot defaults list[] of { type: "attribute", children: null, name: "xLabelAnchor", value: "center" }
        const compiled = await astToDOM(ast, { api: mc.api } as any);
        return { compiled, meta };
      } catch (error) {
        console.error(error);
        toast({ title: "Mosaic render error: " + (error as Error).message, status: "error", isClosable: true });
        return {};
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Mosaic parse error: " + (error as Error).message, status: "error", isClosable: true });
    }
  }, [spec]);

  return (
    <Box>
      {chart.loading ? <LoadingSpinner /> : null}
      {chart.result?.compiled?.element! ? (
        <SimpleChart element={chart.result.compiled.element!} meta={chart.result.meta ?? {}} />
      ) : null}
    </Box>
  );
};