import { toPng, toJpeg, toBlob, toPixelData, toSvg, getFontEmbedCSS } from 'html-to-image';
import { Options } from 'html-to-image/lib/types';

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  downloadLink(url, fileName);
}

export function downloadLink(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  // URL.revokeObjectURL(url);
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

// Renders the images at double size so they are high-resolution
const RESOLUTION_BOOST = 2;

export async function exportChart(chart: SVGSVGElement | HTMLElement, fileName: string, format: "svg" | "png" | "jpg" = "png") {
  // TODO: we could export the title, description, and source credit (this would also add padding which would be nice)
  
  // Just ignore errors like `Error inlining remote css file DOMException: CSSStyleSheet.cssRules getter: Not allowed to access cross-origin stylesheet`
  // We fixed by adding crossorigin="anonymous" to the Inter google fonts stylesheet
  // Array.from(document.styleSheets).forEach((s) => {
  //   if (isElement(s.ownerNode!)) {
  //     (s.ownerNode! as any).crossOrigin = "anonymous"
  //   }
  // })
  const fontEmbedCSS = await getFontEmbedCSS(chart as any);

  const dims = chart.getBoundingClientRect();

  const options: Options = { backgroundColor: "#fff", fontEmbedCSS, canvasHeight: dims.height * RESOLUTION_BOOST, canvasWidth: dims.width * RESOLUTION_BOOST }

  if (format == "svg") {
    downloadLink(await toSvg(chart as any, options), fileName);
  } else if (format == "png") {
    downloadLink(await toPng(chart as any, options), fileName);
  } else if (format == "jpg") {
    downloadLink(await toJpeg(chart as any, options), fileName);
  }
}
