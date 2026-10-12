import { handleApi } from '../server/api.mjs';
import { vercelRequest } from '../server/vercel-adapter.mjs';

export default async function handler(req,res){
  const response=await handleApi(vercelRequest(req,process.env));
  res.statusCode=response.status;
  for(const [key,value] of response.headers)res.setHeader(key,value);
  res.end(await response.text());
}
