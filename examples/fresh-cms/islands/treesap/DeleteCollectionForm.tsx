export default function DeleteCollectionForm(props: { collection: string }) {
  const { collection } = props;
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
  
    const confirm = globalThis.confirm("Are you sure you want to delete this collection?");
    if (!confirm) return;
  
    const res = await fetch(`/api/collections/${collection}`, { method: "DELETE" });

    console.log("response", res); 
    if (res.ok) {
      globalThis.location.href = "/admin";
    }
  }
  return (
    <form method="POST" onSubmit={handleSubmit}>
      <button type="submit" class="bg-red-500 text-white px-4 py-2 rounded-md">Delete</button>
    </form>
  )
}