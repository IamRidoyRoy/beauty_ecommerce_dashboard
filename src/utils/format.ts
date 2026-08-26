const takaNumber = new Intl.NumberFormat('en-BD', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** User-facing dashboard currency: always Bangladeshi Taka with the ৳ sign. */
export const money=(value:unknown)=>{
  const raw=Number(value??0)
  const n=Number.isFinite(raw)?raw:0
  return `৳${takaNumber.format(n)}`
}
export const number=(value:unknown)=>new Intl.NumberFormat('en-US').format(Number(value||0))
export const date=(value?:string|null)=>value?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium'}).format(new Date(value)):'—'
export const dateTime=(value?:string|null)=>value?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—'
export const titleCase=(value:string='')=>value.replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase())
