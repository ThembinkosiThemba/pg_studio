# Pg Studio

A modern, open-source web-based tool to explore, query, and manage PostgreSQL databases.

<img src="public/studio.png" alt="Pg Studio" width="60%">

## Features

- **Multiple Connections** - Connect to multiple PostgreSQL databases from one dashboard
- **Database Explorer** - Browse databases, tables, and columns with an intuitive interface
- **Data Preview** - Automatically preview the first 10 rows of any table
- **SQL Query Editor** - Write and execute custom SQL queries with syntax highlighting
- **Schema Viewer** - View table schemas with column types and nullable info
- **Quick Actions** - Drop tables and databases with confirmation dialogs
- **Secure** - Connection strings are stored securely and never exposed to the client after creation
- **Breadcrumb Navigation** - Easy navigation between connections, databases, and tables

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ThembinkosiThemba/pg-studio.git
cd pg-studio
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/postgres-studio
JWT_SECRET=your-secret-key-here
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign up** for an account
2. **Add a connection** with your PostgreSQL connection string
3. **Select a connection** to view available databases
4. **Click a database** to see its tables
5. **Click a table** to preview data, view schema, or run queries

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.
