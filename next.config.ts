import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O app só fica acessível em /cerne-gestor — o domínio raiz não expõe nada.
  basePath: "/cerne-gestor",
};

export default nextConfig;
