
export default function DateInput({ name, value }: { name: string, value: string }) {
  return <input type="date" name={name} value={value} />;
}