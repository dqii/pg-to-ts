/**
 * Generate typescript interface from table schema
 * Created by xiamx on 2016-08-10.
 */

//tslint:disable

import _ from 'lodash';
import {singular} from 'pluralize';
import {TableDefinition, ForeignKey} from './schemaInterfaces';
import Options from './options';

function nameIsReservedKeyword(name: string): boolean {
  const reservedKeywords = ['string', 'number', 'package', 'public'];
  return reservedKeywords.indexOf(name) !== -1;
}

/**
 * Returns a version of the name that can be used as a symbol name, e.g.
 * 'number' --> 'number_'.
 */
function getSafeSymbolName(name: string): string {
  if (nameIsReservedKeyword(name)) {
    return name + '_';
  } else {
    return name;
  }
}

function quotedArray(xs: string[]) {
  return '[' + xs.map(x => `'${x}'`).join(', ') + ']';
}

function quoteNullable(x: string | null | undefined) {
  return x === null || x === undefined ? 'null' : `'${x}'`;
}

function quoteForeignKeyMap(x: {[columnName: string]: ForeignKey}): string {
  const colsTs = _.map(x, (v, k) => {
    return `${k}: { table: '${v.table}', column: '${v.column}', $type: null as unknown /* ${v.table} */ },`;
  });
  return '{' + colsTs.join('\n  ') + '}';
}

const JSDOC_TYPE_RE = /@type \{([^}]+)\}/;

function isNonNullish<T>(x: T): x is Exclude<T, null | undefined> {
  return x !== null && x !== undefined;
}

export interface TableNames {
  var: string;
  type: string;
  input: string;
}

/**
 * generateTableInterface() leaves some references to be filled in later, when a more complete
 * picture of the schema is available. This fills those references in:
 * 'null as unknown /* users *\/' --> 'null as unknown as Users'.
 */
export function attachJoinTypes(
  tableTs: string,
  tableToNames: Record<string, TableNames>,
): string {
  return tableTs.replace(
    /(\$type: null as unknown) \/\* ([^*]+) \*\//g,
    (match, g1, tableName) => {
      const names = tableToNames[tableName];
      return names ? g1 + ' as ' + names.type : match;
    },
  );
}

/** Returns [Table TypeScript, output variable name, set of TS types to import] */
export function generateTableInterface(
  tableName: string,
  tableDefinition: TableDefinition,
  schemaName: string,
  options: Options,
): [
  code: string,
  names: TableNames,
  typesToImport: Set<string>,
  isUpdatable: boolean,
] {
  let selectableMembers = '';
  let insertableMembers = '';
  const columns: string[] = [];
  const requiredForInsert: string[] = [];
  const typesToImport = new Set<string>();

  for (const columnNameRaw of Object.keys(tableDefinition.columns)) {
    const columnName = options.transformColumnName(columnNameRaw),
      columnDef = tableDefinition.columns[columnNameRaw],
      comment = columnDef.comment,
      possiblyOrNull = columnDef.nullable ? ' | null' : '',
      insertablyOptional =
        columnDef.nullable || columnDef.hasDefault ? '?' : '',
      jsdoc = comment ? `/** ${comment} */\n` : '';

    let {tsType} = columnDef;
    if (tsType === 'Json' && options.options.jsonTypesFile && comment) {
      const m = JSDOC_TYPE_RE.exec(comment);
      if (m) {
        tsType = m[1].trim();
        typesToImport.add(tsType);
      }
    }

    selectableMembers += `${jsdoc}${columnName}: ${tsType}${possiblyOrNull};\n`;
    insertableMembers += `${jsdoc}${columnName}${insertablyOptional}: ${tsType}${possiblyOrNull};\n`;

    columns.push(columnName);
    if (!columnDef.nullable && !columnDef.hasDefault) {
      requiredForInsert.push(columnName);
    }
  }

  const {prefixWithSchemaNames} = options.options;
  let qualifiedTableName = tableName;
  let sqlTableName = tableName;
  if (prefixWithSchemaNames) {
    qualifiedTableName = schemaName + '_' + qualifiedTableName;
    sqlTableName = schemaName + '.' + sqlTableName;
  }
  const tableVarName = getSafeSymbolName(qualifiedTableName); // e.g. schema_table_name
  let camelTableName = _.startCase(_.camelCase(tableVarName)).replace(/ /g, ''); // e.g. SchemaTableName
  if (options.options.singularize) camelTableName = singular(camelTableName);

  const {primaryKey, comment, isView, isUpdatable} = tableDefinition;
  const foreignKeys = _.pickBy(
    _.mapValues(
      _.mapKeys(tableDefinition.columns, (v, k) =>
        options.transformColumnName(k),
      ),
      c => c.foreignKey,
    ),
    isNonNullish,
  );
  const jsdoc = comment ? `/** ${comment} */\n` : '';

  const names: TableNames = {
    var: tableVarName,
    type: camelTableName,
    input: camelTableName + 'Input',
  };

  const typescript = [
    `// ${isView ? 'View' : 'Table'} ${sqlTableName}`,
    `${jsdoc} export interface ${names.type} {${selectableMembers}}`,
    isUpdatable ? `export interface ${names.input} {${insertableMembers}}` : '',
    `const ${names.var} = {
      ${isView ? 'viewName' : 'tableName'}: '${sqlTableName}',
      columns: ${quotedArray(columns)},
      ${
        isUpdatable
          ? `
          requiredForInsert: ${quotedArray(requiredForInsert)},
          primaryKey: ${quoteNullable(primaryKey)},
          foreignKeys: ${quoteForeignKeyMap(foreignKeys)},`
          : ''
      }
      $type: null as unknown as ${names.type},
      ${isUpdatable ? `$input: null as unknown as ${names.input}` : ''}
    };`,
  ]
    .filter(s => !!s)
    .join('\n');

  return ['\n' + typescript + '\n', names, typesToImport, isUpdatable];
}

export function generateEnumType(
  enumObject: Record<string, string[]>,
  options: Options,
) {
  let enumString = '';
  for (const enumNameRaw in enumObject) {
    const enumName = options.transformTypeName(enumNameRaw);
    enumString += `export type ${enumName} = `;
    enumString += enumObject[enumNameRaw]
      .map((v: string) => `'${v}'`)
      .join(' | ');
    enumString += ';\n';
  }
  return enumString;
}
