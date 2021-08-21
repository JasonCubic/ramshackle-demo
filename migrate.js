const mssql = require('mssql');
const casual = require('casual');

/**
 * -- This migration script does the following
 * 1. create the DB if it does not exist
 * 2. check for a key named migration-applied in a json table in this DB named meta_info
 * 3. if the table meta_info doesn't exist then this migration runs
 * 4. if the migration revision in meta_info is less than this migrationRev then this migration runs
 *
 * -- If this migration runs then this gets done:
 * 1. create meta_info table if it does not exist
 * 2. run a few commands to create the non-admin user account for the DB with user level access to the DB
 * 3. create a users table
 * 4. populate some fake data into the user table
 * 5. add a key into the meta_info table to indicate this migration revision has been run
 */

const migrationRev = 20210805;

async function simpleDbQuery(pool, queryString) {
  const request = pool.request();
  const result = await request.query(queryString);
  return result?.recordset ?? [];
}

(async () => {
  console.log('migrate started');
  let pool;
  try {
    pool = await new mssql.ConnectionPool({
      user: process.env?.SA_USERNAME ?? 'SA',
      password: process.env?.SA_PASSWORD ?? '',
      server: 'ramshackle-mssql',
      port: 1433,
      options: {
        trustServerCertificate: true,
        // https://docs.microsoft.com/en-us/sql/t-sql/statements/set-arithabort-transact-sql?view=sql-server-ver15#remarks
        enableArithAbort: true,
      },
    });
  } catch (err) {
    console.log('ERROR: creating new pool SQL error', err.message, err);
    process.exit(1);
  }
  try {
    await pool.connect();
  } catch (err) {
    console.log('ERROR: connecting pool SQL error', err.message, err);
    pool.close();
    process.exit(1);
  }

  let systemDbCollection;
  try {
    systemDbCollection = await simpleDbQuery(pool, 'SELECT name FROM master.dbo.sysdatabases');
  } catch (err) {
    console.log('getSystemDatabases error', err.message, err);
    pool.close();
    process.exit(1);
  }
  console.log('systemDbCollection: ', systemDbCollection);

  const dbIndex = systemDbCollection.findIndex((dbRow) => dbRow.name === 'ramshackle');

  try {
    if (dbIndex === -1) {
      console.log('creating DB');
      await simpleDbQuery(pool, 'CREATE DATABASE [ramshackle]');
    }
  } catch (err) {
    console.log('createDB error', err.message, err);
    pool.close();
    process.exit(1);
  }

  let allTables;
  try {
    allTables = await simpleDbQuery(pool, `
      SELECT count(*) as 'numFound'
        FROM ramshackle.INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'meta_info' AND TABLE_TYPE = 'BASE TABLE'
    `);
  } catch (err) {
    console.log('allTables error', err.message, err);
    pool.close();
    process.exit(1);
  }
  const hasMetaInfoTable = (allTables?.[0]?.numFound ?? 0) > 0;
  console.log('hasMetaInfoTable: ', hasMetaInfoTable);
  if (hasMetaInfoTable) {
    let migrationRevRecordset;
    try {
      migrationRevRecordset = await simpleDbQuery(pool, `
        SELECT JSON_VALUE(json_data,'$.value') AS 'migrationRev'
          FROM [ramshackle].[dbo].[meta_info]
          WHERE JSON_VALUE(json_data,'$.key') = 'migration-applied';
      `);
    } catch (err) {
      console.log('migrationRevRecordset error', err.message, err);
      pool.close();
      process.exit(1);
    }
    const isCurrentMigration = parseInt((migrationRevRecordset?.[0]?.migrationRev ?? 0), 10) >= migrationRev;
    console.log('isCurrentMigration: ', isCurrentMigration);
    if (isCurrentMigration) {
      console.log('this is the current migration.  Migration is not being run.');
      pool.close();
      return;
    }
  }

  const migrationSteps = [
    `
    IF NOT EXISTS (SELECT * FROM ramshackle.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'meta_info' AND TABLE_TYPE = 'BASE TABLE')
    BEGIN
    CREATE TABLE [ramshackle].[dbo].[meta_info](
      [meta_id] [int] IDENTITY(1,1) NOT NULL,
      [json_data] [nvarchar](max),
    PRIMARY KEY CLUSTERED
    (
      [meta_id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
    END
    `,
    `
    If Exists (select loginname from master.dbo.syslogins where name = 'ramshackle_user')
    Begin
        DROP LOGIN ramshackle_user
    End
    `,
    'USE ramshackle; DROP USER IF EXISTS ramshackle_user',
    "CREATE LOGIN ramshackle_user WITH PASSWORD = 'us3rS3cretPass'",
    'USE ramshackle; CREATE USER [ramshackle_user] FOR LOGIN [ramshackle_user];',
    `
    USE ramshackle;
    GRANT CONNECT,SELECT,INSERT,UPDATE,DELETE,VIEW ANY COLUMN ENCRYPTION KEY DEFINITION,VIEW ANY COLUMN MASTER KEY DEFINITION
    TO ramshackle_user;`,
    `
    IF NOT EXISTS (SELECT * FROM ramshackle.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users' AND TABLE_TYPE = 'BASE TABLE')
    BEGIN
    CREATE TABLE [ramshackle].[dbo].[users](
      [user_id] [int] IDENTITY(1,1) NOT NULL,
      [first_name] [varchar](35) NOT NULL,
      [last_name] [varchar](35) NOT NULL,
      [address] [varchar](100) NOT NULL,
      [username] [varchar](35) NOT NULL,
      [password] [varchar](35) NOT NULL,
      [email] [varchar](40) NOT NULL,
      [company_name] [varchar](35) NOT NULL,
      [phone] [varchar](35) NOT NULL,
      [date_joined] [varchar](35) NOT NULL,
      [card_type] [varchar](35) NOT NULL,
      [card_number] [varchar](35) NOT NULL,
      [card_exp] [varchar](35) NOT NULL,
      [card_cvv] [varchar](35) NOT NULL
    PRIMARY KEY CLUSTERED
    (
      [user_id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
    END
    `,
  ];

  for (let j = 0; j < migrationSteps.length; j += 1) {
    try {
      await simpleDbQuery(pool, migrationSteps[j]);
    } catch (err) {
      console.log('ERROR', migrationSteps[j], err.message, err);
      pool.close();
      process.exit(1);
    }
  }

  for (let j = 0; j < 500; j += 1) {
    const cardType = casual.card_type;
    const queryString = `
    INSERT INTO [ramshackle].[dbo].[users] (
      [first_name],
      [last_name],
      [address],
      [username],
      [password],
      [email],
      [company_name],
      [phone],
      [date_joined],
      [card_type],
      [card_number],
      [card_exp],
      [card_cvv]
    ) VALUES (
      '${casual.first_name}',
      '${casual.last_name}',
      '${casual.address}',
      '${casual.username}',
      '${casual.password}',
      '${casual.email}',
      '${casual.company_name}',
      '${casual.phone}',
      '${casual.date('YYYY-MM-DD')} ${casual.time('HH:mm:ss')}',
      '${cardType}',
      '${casual.card_number(cardType)}',
      '${casual.card_exp}',
      '${casual.integer(100, 999)}'
    )`;
    try {
      await simpleDbQuery(pool, queryString);
    } catch (err) {
      console.log('ERROR', queryString, err.message, err);
      pool.close();
      process.exit(1);
    }
  }

  try {
    await simpleDbQuery(pool, `INSERT INTO [ramshackle].[dbo].[meta_info] ([json_data]) VALUES ('${JSON.stringify({ key: 'migration-applied', value: migrationRev })}')`);
  } catch (err) {
    console.log('insert into meta_info error', err.message, err);
    pool.close();
    process.exit(1);
  }

  pool.close();
  console.log('migrate finished');
})();
