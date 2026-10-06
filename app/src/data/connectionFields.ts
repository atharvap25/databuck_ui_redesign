export type SourceType =
  | 'ApacheKafka'
  | 'AzureCosmosDB'
  | 'AzureDataLakeStorageGen1'
  | 'AzureDataLakeStorageGen2Batch'
  | 'AzureSynapseMSSQL'
  | 'BigQuery'
  | 'DatabricksDeltaLake'
  | 'FileSystem Batch'
  | 'Hive Kerberos'
  | 'Impala'
  | 'MapR Hive'
  | 'MongoDB'
  | 'MSSQL'
  | 'MSSQLAD'
  | 'MYSQL'
  | 'Oracle'
  | 'Postgres'
  | 'SnowFlake'
  | 'S3 Batch'
  | 'S3 IAMRole Batch'
  | 'S3 IAMRole Config Batch'
  | 'Teradata'
  | 'MicroStrategy Cubes'
  | 'GCS Batch'
  | 'DB2'
  | 'OpenSearch'

export type FieldKind = 'text' | 'password' | 'number' | 'enum' | 'boolean' | 'readonly'
export type SchemaFamily = 'jdbc' | 'bigquery' | 'file' | 'kafka' | 'document' | 'microstrategy'

export type ConnectionField = {
  key: string
  label: string
  kind: FieldKind
  options?: string[]
}

export type FieldGroup = {
  id: string
  label: string
  fields: ConnectionField[]
}

export const dataSourceCatalog: { id: SourceType; displayName: string }[] = [
  { id: 'ApacheKafka', displayName: 'Apache Kafka' },
  { id: 'AzureCosmosDB', displayName: 'Azure Cosmos DB' },
  { id: 'AzureDataLakeStorageGen1', displayName: 'Azure Data Lake Storage Gen1' },
  { id: 'AzureDataLakeStorageGen2Batch', displayName: 'Azure Data Lake Storage Gen2 (Batch)' },
  { id: 'AzureSynapseMSSQL', displayName: 'Azure Synapse MSSQL' },
  { id: 'BigQuery', displayName: 'Big Query' },
  { id: 'DatabricksDeltaLake', displayName: 'Databricks Delta Lake' },
  { id: 'FileSystem Batch', displayName: 'File System (Batch)' },
  { id: 'Hive Kerberos', displayName: 'Hive (Kerberos)' },
  { id: 'Impala', displayName: 'Impala' },
  { id: 'MapR Hive', displayName: 'MapR Hive' },
  { id: 'MongoDB', displayName: 'MongoDB' },
  { id: 'MSSQL', displayName: 'MSSQL' },
  { id: 'MSSQLAD', displayName: 'MSSQL (Active Directory)' },
  { id: 'MYSQL', displayName: 'MYSQL' },
  { id: 'Oracle', displayName: 'Oracle (Standalone)' },
  { id: 'Postgres', displayName: 'Postgres' },
  { id: 'SnowFlake', displayName: 'Snowflake' },
  { id: 'S3 Batch', displayName: 'S3 (Batch)' },
  { id: 'S3 IAMRole Batch', displayName: 'S3 IAMRole (Batch)' },
  { id: 'S3 IAMRole Config Batch', displayName: 'S3 IAMRole Config (Batch)' },
  { id: 'Teradata', displayName: 'Teradata' },
  { id: 'MicroStrategy Cubes', displayName: 'MicroStrategy Cubes' },
  { id: 'GCS Batch', displayName: 'GCS (Batch)' },
  { id: 'DB2', displayName: 'DB2' },
  { id: 'OpenSearch', displayName: 'OpenSearch' },
]

export const sourceTypes: SourceType[] = dataSourceCatalog.map((item) => item.id)

export const typeLabels: Record<SourceType, string> = Object.fromEntries(
  dataSourceCatalog.map((item) => [item.id, item.displayName]),
) as Record<SourceType, string>

const identity: FieldGroup = {
  id: 'identity',
  label: 'Identity',
  fields: [
    { key: '_name', label: 'Name', kind: 'text' },
    { key: '_schema', label: 'Schema', kind: 'text' },
    { key: 'projectName', label: 'Project', kind: 'text' },
    { key: 'domainName', label: 'Domain', kind: 'text' },
    { key: 'createdAtStr', label: 'Created on', kind: 'readonly' },
    { key: 'createdByUser', label: 'Created by', kind: 'readonly' },
  ],
}

const jdbc: FieldGroup = {
  id: 'connection',
  label: 'Connection',
  fields: [
    { key: 'ipAddress', label: 'Host', kind: 'text' },
    { key: 'port', label: 'Port', kind: 'number' },
    { key: 'databaseSchema', label: 'Database / schema', kind: 'text' },
    { key: 'username', label: 'Username', kind: 'text' },
    { key: 'password', label: 'Password', kind: 'password' },
    { key: 'sslEnb', label: 'SSL', kind: 'boolean' },
    { key: 'sslTrustStorePath', label: 'Trust store path', kind: 'text' },
    { key: 'trustPassword', label: 'Trust store password', kind: 'password' },
  ],
}

const kerberos: FieldGroup = {
  id: 'kerberos',
  label: 'Kerberos',
  fields: [
    { key: 'domain', label: 'Kerberos domain', kind: 'text' },
    { key: 'keytab', label: 'Keytab', kind: 'text' },
    { key: 'krb5conf', label: 'krb5.conf path', kind: 'text' },
    { key: 'gss_jaas', label: 'GSS JAAS', kind: 'text' },
    { key: 'serviceName', label: 'Service name', kind: 'text' },
    { key: 'hivejdbchost', label: 'Hive JDBC host', kind: 'text' },
    { key: 'hivejdbcport', label: 'Hive JDBC port', kind: 'number' },
    { key: 'zookeeperUrl', label: 'ZooKeeper URL', kind: 'text' },
    { key: 'gatewayPath', label: 'Gateway path', kind: 'text' },
  ],
}

const bigquery: FieldGroup = {
  id: 'bigquery',
  label: 'BigQuery',
  fields: [
    { key: 'bigQueryProjectName', label: 'GCP project', kind: 'text' },
    { key: 'datasetName', label: 'Dataset', kind: 'text' },
    { key: 'clientEmail', label: 'Client email', kind: 'text' },
    { key: 'clientId', label: 'Client ID', kind: 'text' },
    { key: 'privatekeyId', label: 'Private key ID', kind: 'text' },
    { key: 'privatekey', label: 'Private key', kind: 'password' },
    { key: 'dataplex_integration_enabled', label: 'Dataplex integration', kind: 'boolean' },
    { key: 'pushDownQueryEnabled', label: 'Push-down query', kind: 'boolean' },
  ],
}

const databricks: FieldGroup = {
  id: 'databricks',
  label: 'Databricks',
  fields: [
    { key: 'httpPath', label: 'Workspace / HTTP path', kind: 'text' },
    { key: 'databaseSchema', label: 'Catalog / schema', kind: 'text' },
    { key: 'clusterPropertyCategory', label: 'Cluster category', kind: 'text' },
    { key: 'clusterPolicyId', label: 'Cluster policy ID', kind: 'text' },
    { key: 'azureAuthenticationType', label: 'Authentication type', kind: 'enum', options: ['PAT', 'Azure AD', 'Service principal'] },
    { key: 'username', label: 'Username / token name', kind: 'text' },
    { key: 'password', label: 'Access token', kind: 'password' },
    { key: 'sslEnb', label: 'SSL', kind: 'boolean' },
  ],
}

const azure: FieldGroup = {
  id: 'azure',
  label: 'Azure',
  fields: [
    { key: 'azureTenantId', label: 'Tenant ID', kind: 'text' },
    { key: 'azureClientId', label: 'Client ID', kind: 'text' },
    { key: 'azureClientSecret', label: 'Client secret', kind: 'password' },
    { key: 'azureServiceURI', label: 'Service URI', kind: 'text' },
    { key: 'azureFilePath', label: 'File path', kind: 'text' },
    { key: 'azureAuthenticationType', label: 'Authentication type', kind: 'enum', options: ['Service principal', 'Account key', 'SAS'] },
  ],
}

const files: FieldGroup = {
  id: 'files',
  label: 'Files',
  fields: [
    { key: 'bucketName', label: 'Bucket / container', kind: 'text' },
    { key: 'folderPath', label: 'Folder path', kind: 'text' },
    { key: 'fileNamePattern', label: 'File name pattern', kind: 'text' },
    { key: 'fileDataFormat', label: 'File format', kind: 'enum', options: ['CSV', 'PSV(Pipe Delimited)', 'TSV', 'JSON', 'Parquet', 'Avro'] },
    { key: 'headerPresent', label: 'Header present', kind: 'boolean' },
    { key: 'headerFilePath', label: 'Header file path', kind: 'text' },
    { key: 'accessKey', label: 'Access key', kind: 'password' },
    { key: 'secretKey', label: 'Secret key', kind: 'password' },
    { key: 'partitionedFolders', label: 'Partitioned folders', kind: 'boolean' },
    { key: 'enableFileMonitoring', label: 'File monitoring', kind: 'boolean' },
    { key: 'fileEncrypted', label: 'Encrypted files', kind: 'boolean' },
    { key: 'kmsAuthDisabled', label: 'KMS auth disabled', kind: 'boolean' },
    { key: 'readLatestPartition', label: 'Read latest partition', kind: 'boolean' },
    { key: 'singleFile', label: 'Single file', kind: 'boolean' },
  ],
}

const kafka: FieldGroup = {
  id: 'kafka',
  label: 'Kafka',
  fields: [
    { key: 'ipAddress', label: 'Brokers', kind: 'text' },
    { key: 'port', label: 'Port', kind: 'number' },
    { key: 'databaseSchema', label: 'Topic pattern', kind: 'text' },
    { key: 'sslEnb', label: 'SSL', kind: 'boolean' },
    { key: 'username', label: 'Username', kind: 'text' },
    { key: 'password', label: 'Password', kind: 'password' },
  ],
}

const microstrategy: FieldGroup = {
  id: 'microstrategy',
  label: 'MicroStrategy',
  fields: [
    { key: 'gatewayPath', label: 'Gateway path', kind: 'text' },
    { key: 'username', label: 'Username', kind: 'text' },
    { key: 'password', label: 'Password', kind: 'password' },
    { key: 'databaseSchema', label: 'Project / cube', kind: 'text' },
  ],
}

const ad: FieldGroup = {
  id: 'directory',
  label: 'Active Directory',
  fields: [{ key: 'domain', label: 'AD domain', kind: 'text' }],
}

const groupsByType: Record<SourceType, FieldGroup[]> = {
  ApacheKafka: [identity, kafka],
  AzureCosmosDB: [identity, azure, { ...jdbc, fields: jdbc.fields.filter((field) => field.key !== 'sslTrustStorePath') }],
  AzureDataLakeStorageGen1: [identity, azure, files],
  AzureDataLakeStorageGen2Batch: [identity, azure, files],
  AzureSynapseMSSQL: [identity, jdbc],
  BigQuery: [identity, bigquery],
  DatabricksDeltaLake: [identity, databricks],
  'FileSystem Batch': [identity, files],
  'Hive Kerberos': [identity, jdbc, kerberos],
  Impala: [identity, jdbc],
  'MapR Hive': [identity, jdbc, kerberos],
  MongoDB: [identity, jdbc],
  MSSQL: [identity, jdbc],
  MSSQLAD: [identity, jdbc, ad],
  MYSQL: [identity, jdbc],
  Oracle: [identity, jdbc],
  Postgres: [identity, jdbc],
  SnowFlake: [identity, jdbc],
  'S3 Batch': [identity, files],
  'S3 IAMRole Batch': [identity, files],
  'S3 IAMRole Config Batch': [identity, files],
  Teradata: [identity, jdbc],
  'MicroStrategy Cubes': [identity, microstrategy],
  'GCS Batch': [identity, files],
  DB2: [identity, jdbc],
  OpenSearch: [identity, jdbc],
}

export function fieldGroupsFor(type: SourceType): FieldGroup[] {
  return groupsByType[type]
}

export function schemaFamily(type: SourceType): SchemaFamily {
  if (type === 'BigQuery') return 'bigquery'
  if (type === 'ApacheKafka') return 'kafka'
  if (type === 'MicroStrategy Cubes') return 'microstrategy'
  if (type === 'MongoDB' || type === 'AzureCosmosDB' || type === 'OpenSearch') return 'document'
  if (
    type === 'FileSystem Batch' ||
    type === 'S3 Batch' ||
    type === 'S3 IAMRole Batch' ||
    type === 'S3 IAMRole Config Batch' ||
    type === 'GCS Batch' ||
    type === 'AzureDataLakeStorageGen1' ||
    type === 'AzureDataLakeStorageGen2Batch'
  ) {
    return 'file'
  }
  return 'jdbc'
}

export const defaultPorts: Record<SourceType, string> = {
  ApacheKafka: '9092',
  AzureCosmosDB: '443',
  AzureDataLakeStorageGen1: '443',
  AzureDataLakeStorageGen2Batch: '443',
  AzureSynapseMSSQL: '1433',
  BigQuery: '443',
  DatabricksDeltaLake: '443',
  'FileSystem Batch': '',
  'Hive Kerberos': '10000',
  Impala: '21050',
  'MapR Hive': '10000',
  MongoDB: '27017',
  MSSQL: '1433',
  MSSQLAD: '1433',
  MYSQL: '3306',
  Oracle: '1521',
  Postgres: '5432',
  SnowFlake: '443',
  'S3 Batch': '',
  'S3 IAMRole Batch': '',
  'S3 IAMRole Config Batch': '',
  Teradata: '1025',
  'MicroStrategy Cubes': '443',
  'GCS Batch': '',
  DB2: '50000',
  OpenSearch: '9200',
}

export const sourceDefaults: Record<SourceType, { nickname: string; host: string; database: string; username: string }> = {
  ApacheKafka: { nickname: 'Kafka source', host: 'kafka.internal:9092', database: 'events.*', username: '' },
  AzureCosmosDB: { nickname: 'Cosmos DB source', host: 'acme.documents.azure.com', database: 'app', username: '' },
  AzureDataLakeStorageGen1: { nickname: 'ADLS Gen1 source', host: 'acme.azuredatalakestore.net', database: '/landing', username: '' },
  AzureDataLakeStorageGen2Batch: { nickname: 'ADLS Gen2 source', host: 'acmestorage', database: 'landing', username: '' },
  AzureSynapseMSSQL: { nickname: 'Synapse source', host: 'acme.sql.azuresynapse.net', database: 'dw.dbo', username: 'synapse_reader' },
  BigQuery: { nickname: 'BigQuery source', host: 'acme-analytics', database: 'acme.analytics', username: 'analytics-job' },
  DatabricksDeltaLake: { nickname: 'Databricks source', host: 'https://adb.azuredatabricks.net', database: 'main.default', username: 'token' },
  'FileSystem Batch': { nickname: 'File source', host: '/data/landing', database: 'landing', username: '' },
  'Hive Kerberos': { nickname: 'Hive source', host: 'hive.internal', database: 'default', username: 'hive_reader' },
  Impala: { nickname: 'Impala source', host: 'impala.internal', database: 'default', username: 'impala_reader' },
  'MapR Hive': { nickname: 'MapR Hive source', host: 'mapr-hive.internal', database: 'default', username: 'mapr_reader' },
  MongoDB: { nickname: 'MongoDB source', host: 'mongo.internal', database: 'app', username: 'mongo_reader' },
  MSSQL: { nickname: 'MSSQL source', host: 'sql.internal', database: 'app.dbo', username: 'readonly' },
  MSSQLAD: { nickname: 'MSSQL AD source', host: 'sql.internal', database: 'app.dbo', username: 'CORP\\reader' },
  MYSQL: { nickname: 'MySQL source', host: 'mysql.internal', database: 'app', username: 'readonly' },
  Oracle: { nickname: 'Oracle source', host: 'oracle.internal', database: 'ORCL', username: 'readonly' },
  Postgres: { nickname: 'Postgres source', host: 'postgres.internal', database: 'app', username: 'readonly' },
  SnowFlake: { nickname: 'Snowflake source', host: 'acme.snowflakecomputing.com', database: 'ANALYTICS.PUBLIC', username: 'readonly' },
  'S3 Batch': { nickname: 'S3 source', host: 's3://acme-landing', database: 'landing', username: '' },
  'S3 IAMRole Batch': { nickname: 'S3 IAM source', host: 's3://acme-landing', database: 'landing', username: '' },
  'S3 IAMRole Config Batch': { nickname: 'S3 IAM config source', host: 's3://acme-landing', database: 'landing', username: '' },
  Teradata: { nickname: 'Teradata source', host: 'td.internal', database: 'prod_db', username: 'readonly' },
  'MicroStrategy Cubes': { nickname: 'MicroStrategy source', host: 'https://mstr.internal', database: 'Finance', username: 'mstr_reader' },
  'GCS Batch': { nickname: 'GCS source', host: 'gs://acme-landing', database: 'landing', username: '' },
  DB2: { nickname: 'DB2 source', host: 'db2.internal', database: 'APP', username: 'readonly' },
  OpenSearch: { nickname: 'OpenSearch source', host: 'opensearch.internal', database: 'logs', username: 'readonly' },
}

export function defaultProperties(type: SourceType): Record<string, string> {
  const defaults = sourceDefaults[type]
  const family = schemaFamily(type)
  const base: Record<string, string> = {
    projectName: 'Production',
    domainName: 'Operations',
    createdByUser: 'Admin User',
    username: defaults.username,
    password: '',
    port: defaultPorts[type],
    databaseSchema: defaults.database,
    sslEnb: 'N',
  }
  if (type === 'BigQuery') {
    base.bigQueryProjectName = defaults.host
    base.datasetName = defaults.database
    base.dataplex_integration_enabled = 'N'
    base.pushDownQueryEnabled = 'N'
  } else if (type === 'DatabricksDeltaLake') {
    base.httpPath = defaults.host
    base.clusterPropertyCategory = 'cluster'
    base.azureAuthenticationType = 'PAT'
  } else if (family === 'file') {
    base.folderPath = defaults.host
    base.bucketName = defaults.database
    base.fileDataFormat = 'CSV'
    base.headerPresent = 'Y'
    base.kmsAuthDisabled = 'Y'
  } else if (type === 'ApacheKafka') {
    base.ipAddress = defaults.host
  } else if (type === 'MicroStrategy Cubes') {
    base.gatewayPath = defaults.host
  } else {
    base.ipAddress = defaults.host
  }
  return base
}

export function applyDraftProperties(
  type: SourceType,
  draft: { host: string; database: string; port: string; username: string; password: string; createdOn: string },
): Record<string, string> {
  const properties = defaultProperties(type)
  const family = schemaFamily(type)
  properties.username = draft.username
  properties.password = draft.password
  properties.port = draft.port
  properties.databaseSchema = draft.database
  properties.createdAtStr = draft.createdOn
  if (type === 'BigQuery') {
    properties.bigQueryProjectName = draft.host
    properties.datasetName = draft.database
  } else if (type === 'DatabricksDeltaLake') {
    properties.httpPath = draft.host
  } else if (family === 'file') {
    properties.folderPath = draft.host
    properties.bucketName = draft.database
  } else if (type === 'MicroStrategy Cubes') {
    properties.gatewayPath = draft.host
  } else {
    properties.ipAddress = draft.host
  }
  return properties
}

export function propertyValue(properties: Record<string, string>, key: string) {
  return properties[key] ?? ''
}

export function isYes(value: string) {
  return value === 'Y' || value === 'y' || value === 'true' || value === 'Yes'
}

export function formatFieldValue(field: ConnectionField, value: string) {
  if (field.kind === 'password') return value ? '••••••••' : '—'
  if (field.kind === 'boolean') return isYes(value) ? 'Yes' : 'No'
  return value || '—'
}

export function endpointMeta(source: { type: SourceType; schema: string; properties: Record<string, string> }) {
  const family = schemaFamily(source.type)
  if (source.type === 'BigQuery') {
    return { label: 'Project', value: source.properties.bigQueryProjectName || source.schema }
  }
  if (source.type === 'DatabricksDeltaLake') {
    return { label: 'Workspace', value: source.properties.httpPath || '' }
  }
  if (family === 'file') {
    return { label: 'Location', value: source.properties.bucketName || source.properties.folderPath || '' }
  }
  if (source.type === 'MicroStrategy Cubes') {
    return { label: 'Gateway', value: source.properties.gatewayPath || '' }
  }
  if (source.type === 'ApacheKafka') {
    return { label: 'Brokers', value: source.properties.ipAddress || '' }
  }
  return { label: 'Host', value: source.properties.ipAddress || '' }
}

export function endpointValue(source: { type: SourceType; schema: string; properties: Record<string, string> }) {
  return endpointMeta(source).value || source.schema
}

export function databaseOf(source: { schema: string; properties: Record<string, string> }) {
  return source.schema || source.properties.datasetName || source.properties.databaseSchema || '—'
}
