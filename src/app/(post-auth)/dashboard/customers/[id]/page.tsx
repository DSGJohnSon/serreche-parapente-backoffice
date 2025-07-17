import CustomerDetails from "./content";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  if (!id) {
    return <div>Customer ID is required</div>;
  }
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <CustomerDetails id={id} />
    </main>
  );
}