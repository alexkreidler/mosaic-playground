# Mosaic Playground

Edit and explore [Mosaic](https://idl.uw.edu/mosaic/) visualizations in your browser. Inspired by the [Vega Editor](https://vega.github.io/editor/#/).

Features:
- Re-renders chart whenever the JSON specification changes. Keeps the last working version when there is an error
- Includes example specifications from the Mosaic website (loads latest versions directly from the Github repo)
- Download SVG or PNG of chart (doesn't include legends, parameters, or concatenated charts)
- Shows underlying DuckDB queries in side panel
- Shows 3 types of errors (JSON parse, Mosaic parse, Mosaic render) as toasts and in the console

![Screenshot](mosaic-playground-screenshot.png)

## Uses

- [Mosaic](https://idl.uw.edu/mosaic/)
- [Observable Plot](https://observablehq.com/plot/getting-started)
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- [Chakra UI](https://chakra-ui.com/)
- [SaaS UI](https://saas-ui.dev/)
- [Vite](https://vitejs.dev/)
- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [SWC](https://swc.rs/)

## License

Apache-2.0
