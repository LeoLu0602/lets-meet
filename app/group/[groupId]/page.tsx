export default function Page({ params }: { params: { groupId: string } }) {
  return <div>{params.groupId}</div>;
}
