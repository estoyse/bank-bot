# Telegram Document Generator Bot

A production-ready Node.js bot that converts Excel rows into personalized Word documents.

## Features

- **Excel Parsing**: Handles dynamic headers, Cyrillic names, and duplicate columns.
- **Word Templating**: Uses `docxtemplater` to preserve formatting while replacing placeholders.
- **Efficient Delivery**: Sends files individually for up to 20 rows, and as a single `.zip` for larger files.
- **Clean Architecture**: Built with modular services (Excel, Word, File, Bot).
- **Scalable**: Uses async/await and cleans up temporary buffers/files immediately after use.

## Tech Stack

- **Node.js**: (LTS recommended)
- **GramJS**: High-performance Telegram MTProto library.
- **XLSX**: Excel parsing.
- **Docxtemplater**: Word template rendering.
- **Winston**: Production-grade logging.

## Installation

1. Clone the repository and navigate into it:

   ```bash
   cd bank-bot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Fill in your Telegram API credentials:

   - `TELEGRAM_API_ID`: Get from [my.telegram.org](https://my.telegram.org)
   - `TELEGRAM_API_HASH`: Get from [my.telegram.org](https://my.telegram.org)
   - `TELEGRAM_BOT_TOKEN`: Get from [@BotFather](https://t.me/BotFather)

5. Prepare the templates:
   - Create a folder named `templates`.
   - Add your Word template named `doc_template.docx` with placeholders like `{{ismFam}}`, `{{ajrtSumma}}`, etc.

## Running Locally

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Example Word Template Placeholders

The bot maps Excel columns directly to placeholders. Ensure your Word file contains:

- `{{ismFam}}`
- `{{ajrtSumma}}`
- `{{boshSana}}`
- `{{ДатаПогаш}}`
- `{{dogNomer}}`
- `{{adress}}`
- `{{qarz}}`
- `{{UmumQarz}}`

## Error Handling & Scalability

- **Error Handling**: Every major operation is wrapped in try-catch with detailed logging.
- **Cleanup**: The `FileManager` ensures all processed files are deleted from the server, even if an error occurs.
- **Buffers**: Media is downloaded into memory buffers to avoid unnecessary disk I/O, then temporary directories are used for zipping when needed.
