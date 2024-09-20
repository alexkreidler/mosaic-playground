// import { downloadSvg, downloadPng } from "svg-crowbar";

const xmlns = "http://www.w3.org/2000/xmlns/";
const xlinkns = "http://www.w3.org/1999/xlink";
const svgns = "http://www.w3.org/2000/svg";

function serialize(svg: SVGSVGElement): ModifiedSVGAndBlob {
  svg = (svg.cloneNode(true) as SVGSVGElement);
  const fragment = window.location.href + "#";
  const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    for (const attr of (walker.currentNode as HTMLElement).attributes) {
      if (attr.value.includes(fragment)) {
        attr.value = attr.value.replace(fragment, "#");
      }
    }
  }
  svg.setAttributeNS(xmlns, "xmlns", svgns);
  svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);

  var defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(svgns, "defs");
    svg.appendChild(defs);
  }

  var style = document.createElementNS(svgns, "style");
  defs.appendChild(style);

  style.textContent = '@import url("https://fonts.googleapis.com/css?family=Inter:wght@400;500;600;700?display=swap");';
  const serializer = new window.XMLSerializer();
  const string = serializer.serializeToString(svg);
  // TODO maybe return modified element for rasterize
  return { svg, blob: new Blob([string], { type: "image/svg+xml" }) };
}

function context2d(width: number, height: number, dpi: number = 3) {
  if (dpi == null) dpi = devicePixelRatio;
  var canvas = document.createElement("canvas");
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  canvas.style.width = width + "px";
  var context = canvas.getContext("2d")!;
  context.scale(dpi, dpi);
  return { context, canvas };
}

interface ModifiedSVGAndBlob {
  svg: SVGSVGElement;
  blob: Blob;
}

// Very close to getting PNG setup to work, we just need to inline the font-face declarations and their woff files as data URIs
// Can we automate this? FIXME: For now just hardcode the inter font
function rasterize(svg: SVGSVGElement): Promise<Blob | null> {
  const promise = new Promise<Blob | null>((resolve, reject) => {
    const image = new Image();
    image.onerror = reject;
    image.onload = () => {
      const rect = svg.getBoundingClientRect();
      const { context, canvas } = context2d(rect.width, rect.height);
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, rect.width, rect.height);
      // Can do PNG, JPG, WEBP
      context.canvas.toBlob(resolve);
    };
    image.src = URL.createObjectURL(serialize(svg).blob);
  });
  return promise;
};

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportChart(chart: SVGSVGElement | HTMLElement, fileName: string, format: "svg" | "png" = "png") {
  const svg = chart.querySelector("svg")!;
  const result = serialize(svg);
  if (format == "svg") {
    downloadBlob(result.blob, fileName);
  } else if (format == "png") {
    const blob = await rasterize(svg);
    if (blob) {
      downloadBlob(blob, fileName);
    }
  }
}
