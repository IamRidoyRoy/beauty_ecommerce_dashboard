import {CrudPage} from '../../components/ui/CrudPage'
import {useWarehousesQuery,useCreateWarehouseMutation,useUpdateWarehouseMutation} from '../../services/inventoryApi'

export default function WarehousesPage(){
  const q=useWarehousesQuery({page_size:500,ordering:'name'})
  const [create]=useCreateWarehouseMutation()
  const [update]=useUpdateWarehouseMutation()

  return <CrudPage
    title="Warehouses"
    description="Physical stock locations used by purchasing, reservations, returns and transfers."
    data={q.data}
    isLoading={q.isLoading}
    isError={q.isError}
    refetch={q.refetch}
    fields={[
      {key:'name',label:'Warehouse name',required:true,placeholder:'Main Warehouse'},
      {key:'code',label:'Warehouse code',required:true,placeholder:'MAIN'},
      {key:'address',label:'Address',type:'textarea',placeholder:'Full warehouse address'},
      {key:'is_active',label:'Active',type:'checkbox'},
    ]}
    createItem={body=>create(body).unwrap()}
    updateItem={(id,body)=>update({id,body}).unwrap()}
    renderRow={item=><div>
      <b className="block text-sm text-zinc-900">{item.name}</b>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
        <span>{item.code}</span>
        {item.address&&<span>{item.address}</span>}
        <span className={item.is_active?'text-emerald-600':'text-zinc-400'}>{item.is_active?'Active':'Inactive'}</span>
      </div>
    </div>}
  />
}
