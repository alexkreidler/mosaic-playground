import React from "react";
import { Menu, MenuButton, MenuList, MenuItem, IconButton, Tooltip } from "@chakra-ui/react";
import { Meta } from "@uwdata/mosaic-spec/dist/types/spec/Spec";
import { exportChart } from "./exportChart";
import { snakeCase } from "change-case";
import { DownloadIcon } from "@chakra-ui/icons";

export const ExportMenu = ({ element, meta }: { element: HTMLElement | SVGSVGElement; meta: Meta }) => {
  return (
    <Menu>
      {/* <Tooltip label="Open Download Menu" placement="top"> */}
      <MenuButton as={IconButton} icon={<DownloadIcon />} aria-label="open download menu" />
      {/* </Tooltip> */}
      <MenuList>
        <MenuItem onClick={() => exportChart(element, meta.title ? snakeCase(meta.title) : "mosaic-chart", "png")}>
          Download PNG
        </MenuItem>
        <MenuItem onClick={() => exportChart(element, meta.title ? snakeCase(meta.title) : "mosaic-chart", "jpg")}>
          Download JPEG
        </MenuItem>
        <MenuItem onClick={() => exportChart(element, meta.title ? snakeCase(meta.title) : "mosaic-chart", "svg")}>
          Download SVG
        </MenuItem>
        {/* TODO: add way to download JSON spec */}
      </MenuList>
    </Menu>
  );
};
