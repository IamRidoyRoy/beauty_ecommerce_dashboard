import {useEffect, useRef, type ReactNode} from 'react'
import {Bold, Italic, Link2, List, ListOrdered, RemoveFormatting, Underline} from 'lucide-react'

type Props={value:string;onChange:(html:string)=>void;placeholder?:string;error?:string}

export function RichTextEditor({value,onChange,placeholder='Write product description…',error}:Props){
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(ref.current && ref.current.innerHTML!==value)ref.current.innerHTML=value||''},[value])
  const command=(name:string,arg?:string)=>{ref.current?.focus();document.execCommand(name,false,arg);onChange(ref.current?.innerHTML||'')}
  const addLink=()=>{const url=window.prompt('Link URL');if(url)command('createLink',url)}
  const Tool=({title,onClick,children}:{title:string;onClick:()=>void;children:ReactNode})=><button type="button" title={title} onMouseDown={e=>e.preventDefault()} onClick={onClick} className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100">{children}</button>
  return <div>
    <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-zinc-200 bg-zinc-50 p-2">
      <Tool title="Bold" onClick={()=>command('bold')}><Bold size={16}/></Tool>
      <Tool title="Italic" onClick={()=>command('italic')}><Italic size={16}/></Tool>
      <Tool title="Underline" onClick={()=>command('underline')}><Underline size={16}/></Tool>
      <span className="mx-1 h-5 w-px bg-zinc-200"/>
      <Tool title="Bullet list" onClick={()=>command('insertUnorderedList')}><List size={16}/></Tool>
      <Tool title="Numbered list" onClick={()=>command('insertOrderedList')}><ListOrdered size={16}/></Tool>
      <Tool title="Add link" onClick={addLink}><Link2 size={16}/></Tool>
      <Tool title="Clear formatting" onClick={()=>command('removeFormat')}><RemoveFormatting size={16}/></Tool>
    </div>
    <div ref={ref} className={`rich-editor ${error?'border-red-400':''}`} contentEditable suppressContentEditableWarning data-placeholder={placeholder} onInput={()=>onChange(ref.current?.innerHTML||'')}/>
    {error&&<p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
}
