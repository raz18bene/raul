// Advance by the number actually returned: PostgREST may enforce a cap below 1000.
// The caller must order by a unique stable column (id), and apply public filters.
export async function readAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{
  data: T[] | null; error: unknown
}>): Promise<T[]> {
  const rows: T[] = []
  for (;;) {
    const { data, error } = await fetchPage(rows.length, rows.length + 999)
    if (error || !data) throw new Error('Catalog query failed')
    if (data.length === 0) return rows
    rows.push(...data)
  }
}
