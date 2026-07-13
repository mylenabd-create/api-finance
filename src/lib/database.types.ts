// Tipos manuais espelhando supabase/migrations/0001_init.sql.
// Se preferir, gere automaticamente depois com:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

type Timestamps = {
  created_at: string;
};

type RawTables = {
      conta: {
        Row: { id: string; nome: string } & Timestamps;
        Insert: { id?: string; nome: string };
        Update: Partial<{ nome: string }>;
      };
      conta_membro: {
        Row: {
          conta_id: string;
          user_id: string;
          papel: "dono" | "membro";
        } & Timestamps;
        Insert: {
          conta_id: string;
          user_id: string;
          papel?: "dono" | "membro";
        };
        Update: Partial<{ papel: "dono" | "membro" }>;
      };
      pessoa: {
        Row: {
          id: string;
          conta_id: string;
          nome: string;
          cor: string;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          nome: string;
          cor?: string;
        };
        Update: Partial<{ nome: string; cor: string }>;
      };
      categoria: {
        Row: {
          id: string;
          conta_id: string;
          nome: string;
          cor: string;
          icone: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          nome: string;
          cor?: string;
          icone?: string | null;
        };
        Update: Partial<{ nome: string; cor: string; icone: string | null }>;
      };
      meta: {
        Row: {
          id: string;
          conta_id: string;
          categoria_id: string;
          tipo: "percentual" | "valor";
          valor: number;
          mes_referencia: string;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          categoria_id: string;
          tipo: "percentual" | "valor";
          valor: number;
          mes_referencia: string;
        };
        Update: Partial<{
          categoria_id: string;
          tipo: "percentual" | "valor";
          valor: number;
          mes_referencia: string;
        }>;
      };
      cartao: {
        Row: {
          id: string;
          conta_id: string;
          banco: string;
          bandeira: string;
          final: string;
          limite_total: number;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          banco: string;
          bandeira: string;
          final: string;
          limite_total?: number;
        };
        Update: Partial<{
          banco: string;
          bandeira: string;
          final: string;
          limite_total: number;
        }>;
      };
      fatura: {
        Row: {
          id: string;
          conta_id: string;
          cartao_id: string;
          mes_referencia: string;
          fechamento: string;
          vencimento: string;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          cartao_id: string;
          mes_referencia: string;
          fechamento: string;
          vencimento: string;
        };
        Update: Partial<{
          mes_referencia: string;
          fechamento: string;
          vencimento: string;
        }>;
      };
      transacao: {
        Row: {
          id: string;
          conta_id: string;
          descricao: string;
          valor: number;
          data: string;
          categoria_id: string | null;
          pessoa_id: string | null;
          fatura_id: string | null;
          origem: "manual" | "ia_texto" | "ia_audio" | "ia_imagem" | "ia_documento";
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          descricao: string;
          valor: number;
          data: string;
          categoria_id?: string | null;
          pessoa_id?: string | null;
          fatura_id?: string | null;
          origem?: "manual" | "ia_texto" | "ia_audio" | "ia_imagem" | "ia_documento";
        };
        Update: Partial<{
          descricao: string;
          valor: number;
          data: string;
          categoria_id: string | null;
          pessoa_id: string | null;
          fatura_id: string | null;
        }>;
      };
      receita: {
        Row: {
          id: string;
          conta_id: string;
          fonte: string;
          valor: number;
          pessoa_id: string | null;
          recorrente: boolean;
          data: string;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          fonte: string;
          valor: number;
          pessoa_id?: string | null;
          recorrente?: boolean;
          data?: string;
        };
        Update: Partial<{
          fonte: string;
          valor: number;
          pessoa_id: string | null;
          recorrente: boolean;
          data: string;
        }>;
      };
      lancamento_futuro: {
        Row: {
          id: string;
          conta_id: string;
          descricao: string;
          valor: number;
          tipo: "recorrente" | "parcelado" | "projetado";
          fluxo: "receita" | "despesa";
          data_inicio: string;
          data_fim: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          descricao: string;
          valor: number;
          tipo: "recorrente" | "parcelado" | "projetado";
          fluxo: "receita" | "despesa";
          data_inicio: string;
          data_fim?: string | null;
        };
        Update: Partial<{
          descricao: string;
          valor: number;
          tipo: "recorrente" | "parcelado" | "projetado";
          fluxo: "receita" | "despesa";
          data_inicio: string;
          data_fim: string | null;
        }>;
      };
      habito: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string;
          nome: string;
          cor: string;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          pessoa_id: string;
          nome: string;
          cor?: string;
        };
        Update: Partial<{ nome: string; cor: string }>;
      };
      habito_registro: {
        Row: {
          id: string;
          habito_id: string;
          data: string;
          concluido: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          habito_id: string;
          data: string;
          concluido?: boolean;
        };
        Update: Partial<{ concluido: boolean }>;
      };
      avaliacao_bioimpedancia: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string;
          data: string;
          peso: number | null;
          altura: number | null;
          gordura: number | null;
          massa_muscular: number | null;
          agua: number | null;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          pessoa_id: string;
          data: string;
          peso?: number | null;
          altura?: number | null;
          gordura?: number | null;
          massa_muscular?: number | null;
          agua?: number | null;
        };
        Update: Partial<{
          peso: number | null;
          altura: number | null;
          gordura: number | null;
          massa_muscular: number | null;
          agua: number | null;
        }>;
      };
      registro_sono: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string;
          data: string;
          hora_dormiu: string | null;
          hora_acordou: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          pessoa_id: string;
          data: string;
          hora_dormiu?: string | null;
          hora_acordou?: string | null;
        };
        Update: Partial<{ hora_dormiu: string | null; hora_acordou: string | null }>;
      };
      treino: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string;
          tipo: string;
          duracao: number;
          data: string;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          pessoa_id: string;
          tipo: string;
          duracao?: number;
          data: string;
        };
        Update: Partial<{ tipo: string; duracao: number; data: string }>;
      };
      compromisso: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string | null;
          titulo: string;
          data: string;
          hora: string | null;
          tipo: "trabalho" | "pessoal" | "pagamento" | "saude";
          gera_tarefa: boolean;
          google_event_id: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          pessoa_id?: string | null;
          titulo: string;
          data: string;
          hora?: string | null;
          tipo: "trabalho" | "pessoal" | "pagamento" | "saude";
          gera_tarefa?: boolean;
          google_event_id?: string | null;
        };
        Update: Partial<{
          pessoa_id: string | null;
          titulo: string;
          data: string;
          hora: string | null;
          tipo: "trabalho" | "pessoal" | "pagamento" | "saude";
          gera_tarefa: boolean;
          google_event_id: string | null;
        }>;
      };
      tarefa: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string | null;
          titulo: string;
          prazo: string | null;
          prioridade: "baixa" | "media" | "alta";
          status: "afazer" | "andamento" | "concluida";
          atrasada: boolean;
          origem: "manual" | "calendario";
          compromisso_id: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          pessoa_id?: string | null;
          titulo: string;
          prazo?: string | null;
          prioridade?: "baixa" | "media" | "alta";
          status?: "afazer" | "andamento" | "concluida";
          atrasada?: boolean;
          origem?: "manual" | "calendario";
          compromisso_id?: string | null;
        };
        Update: Partial<{
          titulo: string;
          prazo: string | null;
          prioridade: "baixa" | "media" | "alta";
          status: "afazer" | "andamento" | "concluida";
          atrasada: boolean;
        }>;
      };
      pratica_espiritual: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string;
          data: string;
        } & Timestamps;
        Insert: { id?: string; conta_id: string; pessoa_id: string; data: string };
        Update: Partial<{ data: string }>;
      };
      livro: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string;
          titulo: string;
          autor: string | null;
          progresso: number;
          atual: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          pessoa_id: string;
          titulo: string;
          autor?: string | null;
          progresso?: number;
          atual?: boolean;
        };
        Update: Partial<{
          titulo: string;
          autor: string | null;
          progresso: number;
          atual: boolean;
        }>;
      };
      lembrete: {
        Row: {
          id: string;
          conta_id: string;
          pessoa_id: string | null;
          texto: string;
          tipo: "pagamento" | "habito" | "compromisso" | "tarefa";
          data_disparo: string;
          dispensado: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          pessoa_id?: string | null;
          texto: string;
          tipo: "pagamento" | "habito" | "compromisso" | "tarefa";
          data_disparo: string;
          dispensado?: boolean;
        };
        Update: Partial<{ dispensado: boolean }>;
      };
      google_calendar_conexao: {
        Row: {
          id: string;
          conta_id: string;
          user_id: string;
          pessoa_id: string | null;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          calendar_id: string;
          ultima_sincronizacao: string | null;
          updated_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          conta_id: string;
          user_id: string;
          pessoa_id?: string | null;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          calendar_id?: string;
          ultima_sincronizacao?: string | null;
          updated_at?: string;
        };
        Update: Partial<{
          access_token: string;
          refresh_token: string;
          expires_at: string;
          calendar_id: string;
          ultima_sincronizacao: string | null;
          updated_at: string;
        }>;
      };
};

type WithRelationships<T> = {
  [K in keyof T]: T[K] & { Relationships: [] };
};

export interface Database {
  public: {
    Tables: WithRelationships<RawTables>;
    Views: Record<string, never>;
    Functions: {
      bootstrap_conta: {
        Args: Record<PropertyKey, never>;
        Returns: { conta_id: string };
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
