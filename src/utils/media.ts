const API_URL=(import.meta.env.VITE_API_URL||'http://127.0.0.1:8000/api/v1').replace(/\/$/,'')
const inferredOrigin=(()=>{try{return new URL(API_URL).origin}catch{return 'http://127.0.0.1:8000'}})()
const MEDIA_ORIGIN=(import.meta.env.VITE_MEDIA_BASE_URL||inferredOrigin).replace(/\/$/,'')

export function mediaUrl(value?:string|null){
  if(!value)return ''
  if(value.startsWith('blob:')||value.startsWith('data:'))return value
  if(value.startsWith('/media/'))return `${MEDIA_ORIGIN}${value}`
  if(value.startsWith('media/'))return `${MEDIA_ORIGIN}/${value}`
  if(/^https?:\/\//i.test(value)){
    try{
      const source=new URL(value)
      const target=new URL(MEDIA_ORIGIN)
      // If Django serialized a loopback URL but the dashboard is configured for a
      // LAN/CDN origin, keep the file path and use the configured public media host.
      if(['127.0.0.1','localhost'].includes(source.hostname)&&!['127.0.0.1','localhost'].includes(target.hostname)){
        return `${target.origin}${source.pathname}${source.search}`
      }
    }catch{}
    return value
  }
  return `${MEDIA_ORIGIN}/media/${value.replace(/^\/+/, '')}`
}
