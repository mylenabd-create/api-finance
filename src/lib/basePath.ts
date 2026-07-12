// Precisa bater com `basePath` em next.config.ts. Fica num arquivo próprio
// porque next/link e next/navigation aplicam o basePath automaticamente,
// mas strings soltas (ex: URL de redirect do OAuth) não.
export const BASE_PATH = "/cerne-gestor";
