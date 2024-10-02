export default function PlainTextField({ name, value }: { name: string, value: string }) {
  return <input type="text" name={name} value={value} />;
}
