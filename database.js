import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import pg from 'pg';

// The portal exposes its own authenticated API. The database schema is not
// exposed through Supabase's browser-facing Data API.
export async function openDatabase({clientFactory}={}){
 const remote=!!process.env.DATABASE_URL;
 if(process.env.REQUIRE_DATABASE_URL==='true'&&!remote)throw new Error('DATABASE_URL is required for free hosting; local storage is not persistent.');
 let sqlite,client;
 if(remote){
  const url=new URL(process.env.DATABASE_URL);
  // Always verify the server certificate, even if the copied URL says require.
  for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key);
  const ca=process.env.DATABASE_CA?.replace(/\\n/g,'\n')||(/\.(supabase\.com|supabase\.co)$/.test(url.hostname)?readFileSync(new URL('./supabase-ca.crt',import.meta.url),'utf8'):undefined);
  client=(clientFactory||((config)=>new pg.Client(config)))({connectionString:url.toString(),ssl:{rejectUnauthorized:true,...(ca?{ca}:{})},connectionTimeoutMillis:15000,statement_timeout:15000,query_timeout:20000});
  await client.connect();
  await client.query('CREATE SCHEMA IF NOT EXISTS apex; REVOKE ALL ON SCHEMA apex FROM PUBLIC; SET search_path TO apex;');
 }else{
  const file=process.env.DB_PATH||'data/portal.sqlite';
  mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
  sqlite=new DatabaseSync(file);
 }
 function translate(sql){
  let i=0;
  sql=sql.replace(/\?/g,()=>'$'+(++i)).replace(/\buser\b/g,'"user"');
  if(sql.startsWith('INSERT OR IGNORE'))sql=sql.replace('INSERT OR IGNORE','INSERT')+' ON CONFLICT DO NOTHING';
  if(sql.startsWith('INSERT OR REPLACE INTO limits'))sql=sql.replace('INSERT OR REPLACE','INSERT')+' ON CONFLICT (key) DO UPDATE SET count=EXCLUDED.count,until=EXCLUDED.until';
  return sql;
 }
 return {
  remote,
  async exec(sql){
   if(!remote)return sqlite.exec(sql);
   if(sql==='BEGIN IMMEDIATE')return client.query('BEGIN');
   sql=sql.replace(/PRAGMA[^;]*;/g,'').replace(/id INTEGER PRIMARY KEY/g,'id SERIAL PRIMARY KEY').replace(/\bBLOB\b/g,'BYTEA').replace(/\bexpires INTEGER\b/g,'expires BIGINT').replace(/\buntil INTEGER\b/g,'until BIGINT').replace(/DEFAULT CURRENT_TIMESTAMP/g,"DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))");
   return client.query(translate(sql));
  },
  async all(sql,...args){if(!remote)return sqlite.prepare(sql).all(...args);return (await client.query(translate(sql),args)).rows},
  async get(sql,...args){return (await this.all(sql,...args))[0]},
  async run(sql,...args){
   if(!remote)return sqlite.prepare(sql).run(...args);
   const returnsId=/^INSERT INTO (users|orgs|projects|records|files|visits|audit)\b/.test(sql);
   const result=await client.query(translate(sql)+(returnsId?' RETURNING id':''),args);
   return {lastInsertRowid:result.rows[0]?.id,changes:result.rowCount};
  },
  async close(){if(remote)await client.end();else sqlite.close()}
 };
}
