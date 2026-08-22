export const rowsOf=<T>(data:any):T[]=>Array.isArray(data)?data:(data?.results||[])
export const countOf=(data:any)=>Array.isArray(data)?data.length:Number(data?.count||0)

const flattenErrors=(value:any,prefix=''):string[]=>{
  if(value===null||value===undefined)return[]
  if(Array.isArray(value))return value.flatMap(v=>flattenErrors(v,prefix))
  if(typeof value==='object')return Object.entries(value).flatMap(([key,v])=>flattenErrors(v,prefix?`${prefix}.${key}`:key))
  const label=prefix?`${prefix.replaceAll('_',' ')}: `:''
  return [`${label}${String(value)}`]
}

export const apiFieldErrors=(e:any):Record<string,string>=>{
  const errors=e?.data?.errors
  if(!errors||typeof errors!=='object'||Array.isArray(errors))return{}
  return Object.fromEntries(Object.entries(errors).map(([key,value])=>[key,flattenErrors(value).map(x=>x.replace(/^.*?: /,'')).join(' ')]))
}

export const apiError=(e:any)=>{
  const d=e?.data
  const detailed=flattenErrors(d?.errors)
  if(detailed.length)return detailed.join(' · ')
  return d?.detail||d?.message||flattenErrors(d).join(' · ')||'Request failed.'
}

export const formData=(obj:Record<string,any>)=>{
  const f=new FormData()
  Object.entries(obj).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')f.append(k,v)})
  return f
}
