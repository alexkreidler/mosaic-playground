import { Box, Heading, Stack, Text } from "@chakra-ui/react";

import React from "react";
import { MosaicPlayground } from "./MosaicPlayground";
import { MosaicProvider } from "./MosaicPlot";

export const App = () => {
  return (
    <MosaicProvider>

      <MosaicPlayground/>
    </MosaicProvider>
  );
};
