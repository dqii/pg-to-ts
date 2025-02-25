#! /usr/bin/env node
/**
 * Commandline interface
 * Created by xiamx on 2016-08-10.
 */

import yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';
import fs from 'fs';
import {typescriptOfSchema} from './index';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <command> [options]')
  .example(
    '$0 generate -c postgres://username:password@localhost/db -t table1 -t table2 -s schema -o interface_output.ts',
    'generate typescript interfaces from schema',
  )
  .global('config')
  .default('config', 'pg-to-ts.json')
  .config()
  .env('PG_TO_TS')
  .demandCommand(1)
  .command(
    'generate',
    'Generate TypeScript matching a Postgres database',
    cmd => {
      return cmd.options({
        conn: {
          alias: 'c',
          describe: 'database connection string',
          demandOption: true,
          type: 'string',
          default: process.env.DATABASE_URL,
        },
        output: {
          alias: 'o',
          describe: 'output file name',
          type: 'string',
          demandOption: true,
          default: 'schema.ts',
        },
        table: {
          alias: 't',
          describe:
            'table name (may specify multiple times for multiple tables)',
          type: 'string',
          array: true,
        },
        excludedTable: {
          alias: 'x',
          describe:
            'excluded table name (may specify multiple times to exclude multiple tables)',
          type: 'string',
          array: true,
        },
        schema: {
          alias: 's',
          type: 'string',
          describe: 'schema name',
        },
        camelCase: {
          alias: 'C',
          describe: 'Camel-case columns (e.g. user_id --> userId)',
          type: 'boolean',
        },
        singularize: {
          alias: 'S',
          describe: 'Singularize table names (e.g., Companies => Company)',
          type: 'boolean',
        },
        datesAsStrings: {
          describe:
            'Treat date, timestamp, and timestamptz as strings, not Dates. ' +
            'Note that you will have to ensure that this is accurate at runtime. ' +
            'See https://github.com/brianc/node-pg-types for details.',
          type: 'boolean',
        },
        prefixWithSchemaNames: {
          describe:
            'Prefix the schema name to the table name. ' +
            ' All exports will be prefixed with the schema name.',
          type: 'boolean',
        },
        jsonTypesFile: {
          describe:
            'If a JSON column has an @type jsdoc tag in its comment, assume that ' +
            'type can be imported from this path.',
          type: 'string',
        },
        noHeader: {
          describe: 'Do not write header',
          type: 'boolean',
        },
      });
    },
  )
  .strictCommands()
  .help('h')
  .alias('h', 'help')
  .parseSync();

(async () => {
  const formattedOutput = await typescriptOfSchema(
    argv.conn,
    argv.table,
    argv.excludedTable,
    argv.schema,
    {
      singularize: argv.singularize,
      camelCase: argv.camelCase,
      writeHeader: !argv.noHeader,
      datesAsStrings: argv.datesAsStrings,
      jsonTypesFile: argv.jsonTypesFile,
      prefixWithSchemaNames: argv.prefixWithSchemaNames,
    },
  );
  fs.writeFileSync(argv.output, formattedOutput);
})()
  .then(() => {
    process.exit();
  })
  .catch((e: unknown) => {
    console.warn(e);
    process.exit(1);
  });
