Followed the steps in [this comment](https://github.com/suren-atoyan/monaco-react/issues/228#issuecomment-2133954587), had this in `beforeMount`:
```ts
configureMonacoYaml(monaco, {
enableSchemaRequest: true,
schemas: [
    {
    // If YAML file is opened matching this glob
    fileMatch: ["*.yaml"],
    // Then this schema will be downloaded from the internet and used.
    uri: JSON_SCHEMA_URL,
    },
],
});
```


When pressing ctrl+enter to get completions inside the data.appl field, I get the following error:
```
Could not create web worker(s). Falling back to loading web worker code in main thread, which might cause UI freezes. Please see https://github.com/microsoft/monaco-editor#faq chunk-JIV6J6RH.js:40838:13
undefined chunk-JIV6J6RH.js:40840:11
Uncaught 
error { target: Worker, isTrusted: true, srcElement: Worker, eventPhase: 0, bubbles: false, cancelable: false, returnValue: true, defaultPrevented: false, composed: false, timeStamp: 15935, … }
```