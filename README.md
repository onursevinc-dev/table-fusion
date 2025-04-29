# Table Fusion

A modern web application built with Next.js that allows users to select and extract tables from PDF documents. This project provides a user-friendly interface for working with PDF files and their tabular data.

## Author

**Onur Sevinc** - [onursevinc.dev](https://onursevinc.dev)

## Features

- PDF file upload and preview
- Table selection and extraction
- Smart table merging with varying columns
- Automatic column alignment and data matching
- Modern and responsive UI
- Dark/Light mode support
- Interactive table selection interface
- PDF manipulation capabilities
- JSON export functionality

## Tech Stack

- **Framework**: Next.js 15.3.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **PDF Processing**: pdf-lib, pdfjs-dist
- **State Management**: React Hooks
- **Build Tool**: Turbopack

## Key Features

### Smart Table Merging

- Automatically merges tables from different pages
- Preserves common columns (e.g., POM Code, POM Description)
- Appends new columns while maintaining data integrity
- Handles overlapping columns intelligently
- Merges rows with the same POM Code

### Table Extraction

- Precise table selection with interactive interface
- Automatic column detection
- Header row preservation
- Data alignment based on column headers

### Export Capabilities

- Export merged tables to JSON format
- Preserves table structure and data
- Works with or without active selection
- Maintains data integrity during export

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd table-fusion
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

## Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm run start
# or
yarn start
```

## Project Structure

```
src/
├── app/           # Next.js app router pages
├── components/    # Reusable React components
├── lib/          # Utility functions and helpers
└── types/        # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Dependencies

### Main Dependencies

- next
- react
- react-dom
- pdf-lib
- pdfjs-dist
- react-pdf
- @radix-ui components
- next-themes
- tailwindcss

### Development Dependencies

- typescript
- eslint
- @types packages
- tailwindcss
- postcss

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Created with ❤️ by [Onur Sevinc](https://onursevinc.dev)
