import * as TypeScript from '../../src/typescript';
import Options from '../../src/options';

const options = new Options({});

const schemaName = 'testschemaname';

describe('TypeScript', () => {
  describe('generateTableInterface', () => {
    it('empty table definition object', () => {
      const [tableInterface, names, types] = TypeScript.generateTableInterface(
        'tableName',
        {
          columns: {},
          primaryKey: null,
          isView: false,
          isUpdatable: true,
        },
        schemaName,
        options,
      );
      expect(tableInterface).toMatchInlineSnapshot(`
        "
        // Table tableName
         export interface TableName {}
        export interface TableNameInput {}
        const tableName = {
              tableName: 'tableName',
              columns: [],
                  requiredForInsert: [],
                  primaryKey: null,
                  foreignKeys: {},
              $type: null as unknown as TableName,
              $input: null as unknown as TableNameInput
            };
        "
      `);
      expect(types).toEqual(new Set());
      expect(names).toMatchInlineSnapshot(`
        Object {
          "input": "TableNameInput",
          "type": "TableName",
          "var": "tableName",
        }
      `);
    });

    it('table with underscores and schema prefix', () => {
      const [tableInterface, names, types] = TypeScript.generateTableInterface(
        'table_name',
        {
          columns: {},
          primaryKey: null,
          isView: false,
          isUpdatable: true,
        },
        schemaName,
        new Options({
          prefixWithSchemaNames: true,
        }),
      );
      expect(tableInterface).toMatchInlineSnapshot(`
        "
        // Table testschemaname.table_name
         export interface TestschemanameTableName {}
        export interface TestschemanameTableNameInput {}
        const testschemaname_table_name = {
              tableName: 'testschemaname.table_name',
              columns: [],
                  requiredForInsert: [],
                  primaryKey: null,
                  foreignKeys: {},
              $type: null as unknown as TestschemanameTableName,
              $input: null as unknown as TestschemanameTableNameInput
            };
        "
      `);
      expect(types).toEqual(new Set());
      expect(names).toMatchInlineSnapshot(`
        Object {
          "input": "TestschemanameTableNameInput",
          "type": "TestschemanameTableName",
          "var": "testschemaname_table_name",
        }
      `);
    });

    it('table name is reserved', () => {
      const [tableInterface, names, types] = TypeScript.generateTableInterface(
        'package',
        {
          columns: {},
          primaryKey: null,
          isView: false,
          isUpdatable: true,
        },
        schemaName,
        options,
      );
      expect(tableInterface).toMatchInlineSnapshot(`
        "
        // Table package
         export interface Package {}
        export interface PackageInput {}
        const package_ = {
              tableName: 'package',
              columns: [],
                  requiredForInsert: [],
                  primaryKey: null,
                  foreignKeys: {},
              $type: null as unknown as Package,
              $input: null as unknown as PackageInput
            } ;
        "
      `);
      expect(types).toEqual(new Set());
      expect(names).toMatchInlineSnapshot(`
        Object {
          "input": "PackageInput",
          "type": "Package",
          "var": "package_",
        }
      `);
    });

    it('table with columns', () => {
      const [tableInterface, names, types] = TypeScript.generateTableInterface(
        'tableName',
        {
          columns: {
            col1: {
              udtName: 'char',
              tsType: 'string',
              nullable: false,
              hasDefault: false,
            },
            col2: {
              udtName: 'bool',
              tsType: 'boolean',
              nullable: false,
              hasDefault: false,
            },
          },
          primaryKey: null,
          isView: false,
          isUpdatable: true,
        },
        schemaName,
        options,
      );
      expect(tableInterface).toMatchInlineSnapshot(`
        "
        // Table tableName
         export interface TableName {col1: string;
        col2: boolean;
        }
        export interface TableNameInput {col1: string;
        col2: boolean;
        }
        const tableName = {
              tableName: 'tableName',
              columns: ['col1', 'col2'],
                  requiredForInsert: ['col1', 'col2'],
                  primaryKey: null,
                  foreignKeys: {},
              $type: null as unknown as TableName,
              $input: null as unknown as TableNameInput
            } ;
        "
      `);
      expect(names).toMatchInlineSnapshot(`
        Object {
          "input": "TableNameInput",
          "type": "TableName",
          "var": "tableName",
        }
      `);
      expect(types).toEqual(new Set());
    });

    it('table with reserved columns', () => {
      const [tableInterface, names, types] = TypeScript.generateTableInterface(
        'tableName',
        {
          columns: {
            string: {
              udtName: 'name1',
              tsType: 'string',
              nullable: false,
              hasDefault: false,
            },
            number: {
              udtName: 'name2',
              tsType: 'number',
              nullable: false,
              hasDefault: false,
            },
            package: {
              udtName: 'name3',
              tsType: 'boolean',
              nullable: false,
              hasDefault: false,
            },
          },
          primaryKey: null,
          isView: false,
          isUpdatable: true,
        },
        schemaName,
        options,
      );

      // None of the reserved word columns need to be quoted.
      expect(tableInterface).toMatchInlineSnapshot(`
        "
        // Table tableName
         export interface TableName {string: string;
        number: number;
        package: boolean;
        }
        export interface TableNameInput {string: string;
        number: number;
        package: boolean;
        }
        const tableName = {
              tableName: 'tableName',
              columns: ['string', 'number', 'package'],
                  requiredForInsert: ['string', 'number', 'package'],
                  primaryKey: null,
                  foreignKeys: {},
              $type: null as unknown as TableName,
              $input: null as unknown as TableNameInput
            } ;
        "
      `);
      expect(names).toMatchInlineSnapshot(`
        Object {
          "input": "TableNameInput",
          "type": "TableName",
          "var": "tableName",
        }
      `);
      expect(types).toEqual(new Set());
    });

    it('table with foreign key', () => {
      const [tableInterface, names, types] = TypeScript.generateTableInterface(
        'table_with_foreign_key',
        {
          columns: {
            id: {
              udtName: 'varchar',
              tsType: 'string',
              nullable: false,
              hasDefault: false,
            },
            user_id: {
              udtName: 'char',
              tsType: 'string',
              nullable: false,
              hasDefault: false,
              foreignKey: {
                table: 'other_table',
                column: 'id',
              },
            },
            sentiment: {
              udtName: 'char',
              tsType: 'string',
              nullable: false,
              hasDefault: false,
            },
          },
          primaryKey: 'id',
          isView: false,
          isUpdatable: true,
        },
        schemaName,
        options,
      );
      expect(tableInterface).toMatchInlineSnapshot(`
        "
        // Table table_with_foreign_key
         export interface TableWithForeignKey {id: string;
        user_id: string;
        sentiment: string;
        }
        export interface TableWithForeignKeyInput {id: string;
        user_id: string;
        sentiment: string;
        }
        const table_with_foreign_key = {
              tableName: 'table_with_foreign_key',
              columns: ['id', 'user_id', 'sentiment'],
                  requiredForInsert: ['id', 'user_id', 'sentiment'],
                  primaryKey: 'id',
                  foreignKeys: {user_id: { table: 'other_table', column: 'id', $type: null as unknown /* other_table */ },},
              $type: null as unknown as TableWithForeignKey,
              $input: null as unknown as TableWithForeignKeyInput
            } ;
        "
      `);
      expect(names).toMatchInlineSnapshot(`
        Object {
          "input": "TableWithForeignKeyInput",
          "type": "TableWithForeignKey",
          "var": "table_with_foreign_key",
        }
      `);
      expect(types).toEqual(new Set());
    });
  });

  describe('generateEnumType', () => {
    it('empty object', () => {
      const enumType = TypeScript.generateEnumType({}, options);
      expect(enumType).toEqual('');
    });
    it('with enumerations', () => {
      const enumType = TypeScript.generateEnumType(
        {
          enum1: ['val1', 'val2', 'val3', 'val4'],
          enum2: ['val5', 'val6', 'val7', 'val8'],
        },
        options,
      );
      expect(enumType).toEqual(
        "export type enum1 = 'val1' | 'val2' | 'val3' | 'val4';\n" +
          "export type enum2 = 'val5' | 'val6' | 'val7' | 'val8';\n",
      );
    });
  });

  describe('attachJoinTypes', () => {
    const tsCode = `
    const table_with_foreign_key = {
      tableName: 'table_with_foreign_key',
      columns: ['id', 'user_id', 'sentiment'],
      requiredForInsert: ['id', 'user_id', 'sentiment'],
      primaryKey: 'id',
      foreignKeys: {user_id: { table: 'other_table', column: 'id', $type: null as unknown /* other_table */ },},
      $type: null as unknown as TableWithForeignKey,
      $input: null as unknown as TableWithForeignKeyInput
    } ;
    `;
    it('should attach joined types to generated TypeScript output', () => {
      expect(
        TypeScript.attachJoinTypes(tsCode, {
          other_table: {
            var: 'other_table',
            type: 'OtherTable',
            input: 'OtherTableInput',
          },
        }),
      ).toMatchInlineSnapshot(`
        "
            const table_with_foreign_key = {
              tableName: 'table_with_foreign_key',
              columns: ['id', 'user_id', 'sentiment'],
              requiredForInsert: ['id', 'user_id', 'sentiment'],
              primaryKey: 'id',
              foreignKeys: {user_id: { table: 'other_table', column: 'id', $type: null as unknown as OtherTable },},
              $type: null as unknown as TableWithForeignKey,
              $input: null as unknown as TableWithForeignKeyInput
            } ;
            "
      `);
    });

    it('should leave unmatched types alone', () => {
      expect(TypeScript.attachJoinTypes(tsCode, {})).toMatchInlineSnapshot(`
        "
            const table_with_foreign_key = {
              tableName: 'table_with_foreign_key',
              columns: ['id', 'user_id', 'sentiment'],
              requiredForInsert: ['id', 'user_id', 'sentiment'],
              primaryKey: 'id',
              foreignKeys: {user_id: { table: 'other_table', column: 'id', $type: null as unknown /* other_table */ },},
              $type: null as unknown as TableWithForeignKey,
              $input: null as unknown as TableWithForeignKeyInput
            } ;
            "
      `);
    });
  });
});
