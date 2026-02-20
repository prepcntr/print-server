# PrepCntr Print Server

An Electron system tray application that runs a local HTTP print server on port 9100. It accepts PDF files via a REST API and sends them to any available printer.

## Platform Support

| Platform | Print Backend | Details |
|----------|--------------|---------|
| macOS & Linux | [unix-print](https://www.npmjs.com/package/unix-print) | Uses the Unix `lp` command |
| Windows | [pdf-to-printer](https://www.npmjs.com/package/pdf-to-printer) | Uses bundled SumatraPDF.exe |

## API

All endpoints are served on `http://127.0.0.1:9100`.

### `GET /printers`

Returns a list of available printers.

### `POST /print`

Prints a PDF file. Accepts multipart form data with:

- `file` - PDF file to print
- `printer` - printer name
- `options` - JSON string with optional fields: `copies`, `pages`, `orientation` (`portrait` | `landscape`), `side` (`simplex` | `duplex` | `duplexshort` | `duplexlong`)

### `GET /health`

Returns `{ "status": "ok" }`.

## Development

```sh
npm install
npm start
```

## Build & Package

```sh
npm run make
```

## Release

Tag a version and push to trigger the GitHub Actions release workflow:

```sh
git tag v1.0.0 && git push origin v1.0.0
```
