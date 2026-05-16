export function DynamicBody({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
