import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");

  // fallback offline do PWA: precisa responder 200 sempre (mesmo deslogado)
  // para o service worker conseguir pré-cachear a página no install.
  // política de privacidade é pública (exigida pelo Google OAuth)
  if (request.nextUrl.pathname === "/offline" || request.nextUrl.pathname === "/privacidade") {
    return response;
  }

  // getSession() lê o JWT dos cookies e só bate na rede se precisar renovar
  // um token expirado — ao contrário de getUser() (sempre revalida no
  // servidor do Supabase), evitando decisões de redirect flakeadas por
  // instabilidade de rede a cada requisição. A validação forte de verdade
  // continua acontecendo nas queries de cada página (RLS) e em
  // getContaAtual(); esta checagem aqui é só um gate de UX de rota.
  let user = null;
  try {
    const { data } = await supabase.auth.getSession();
    user = data.session?.user ?? null;
  } catch {
    // Falha de rede ao validar a sessão (ex: instabilidade local de TLS).
    // Não força nenhum redirecionamento nesse caso — decisões inconsistentes
    // entre requisições (uma falha, a próxima não) criariam um loop de
    // redirect entre "/" e "/login". As páginas protegidas já checam a
    // sessão de novo via getContaAtual() e redirecionam sozinhas se preciso.
    return response;
  }

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
