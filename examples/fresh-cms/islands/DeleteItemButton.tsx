
function DeleteItemButton(props: { collection: string, id: string }) {
    const { collection, id } = props;

    const handleClick = async (e: Event) => {
        e.preventDefault(); 
        const confirm = globalThis.confirm("Are you sure you want to delete this item?");
        if (!confirm) return; 

        //fetch delete from api
        const res = await fetch(
          `/api/${collection}/${id}`,
          {
            method: "DELETE",
          }
        )

        if (res.ok) {
            globalThis.location.href = `/cms/${collection}`;
        } else {
            console.log("Error deleting item");
        }

      
    };

    return (
        <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={handleClick}>
            Delete Item
        </button>
    );
}

export default DeleteItemButton;

