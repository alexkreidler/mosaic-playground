
import Editor from "@monaco-editor/react";
import { KeyCode, KeyMod, type languages } from "monaco-editor";
import * as monaco from "monaco-editor";

export type SpecFormat = "json" | "yaml";

const JSON_SCHEMA_URL = "https://raw.githubusercontent.com/uwdata/mosaic/main/docs/public/schema/v0.12.2.json";
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

export interface IMosaicEditorProps {
  specFormat: string, rawSpec: string, setRawSpec: (spec: string) => void, parsedSpec: any
}
/** A Monaco-based editor for Mosaic specifications in JSON and YAML, with autocomplete for JSON */
export function MosaicEditor({specFormat,rawSpec,setRawSpec, parsedSpec}: IMosaicEditorProps) {
  return <Editor
    height="100%"
    defaultLanguage="json"
    language={specFormat}
    value={rawSpec}
    onChange={(v) => setRawSpec(v ?? "")}
    beforeMount={(monaco) => {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions(getSchemas());
    } }
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
    } } />;
}
