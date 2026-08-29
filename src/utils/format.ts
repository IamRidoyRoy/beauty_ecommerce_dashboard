export const money=(value:unknown,currency='BDT')=>new Intl.NumberFormat('en-BD',{style:'currency',currency,maximumFractionDigits:2}).format(Number(value||0))
export const moneyWhole=(value:unknown,currency='BDT')=>new Intl.NumberFormat('en-BD',{style:'currency',currency,maximumFractionDigits:0,minimumFractionDigits:0}).format(Math.round(Number(value||0)))
export const number=(value:unknown)=>new Intl.NumberFormat('en-US').format(Number(value||0))
export const date=(value?:string|null,withTime=false)=>value?new Intl.DateTimeFormat('en-GB',withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}).format(new Date(value)):'—'
export const percent=(value:unknown)=>`${Number(value||0).toFixed(1)}%`
export const titleCase=(s='')=>s.replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase())
export const cx=(...v:Array<string|false|null|undefined>)=>v.filter(Boolean).join(' ')
