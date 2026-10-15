// Gerado a partir do banco (projeto okhldqmyweioegpmxlbw). Não edite à mão: gere de novo quando o esquema mudar.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alertas_enviados: {
        Row: {
          canal: string
          enviado_em: string
          id: string
          oferta: Json
          oferta_chave: string
          rota_id: string | null
          user_id: string
        }
        Insert: {
          canal: string
          enviado_em?: string
          id?: string
          oferta: Json
          oferta_chave: string
          rota_id?: string | null
          user_id: string
        }
        Update: {
          canal?: string
          enviado_em?: string
          id?: string
          oferta?: Json
          oferta_chave?: string
          rota_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_enviados_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas_salvas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_enviados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buscas_cache: {
        Row: {
          companhia: string
          criado_em: string
          data_volta: string | null
          data_voo: string
          destino: string
          id: string
          origem: string
          resultado: Json
        }
        Insert: {
          companhia: string
          criado_em?: string
          data_volta?: string | null
          data_voo: string
          destino: string
          id?: string
          origem: string
          resultado: Json
        }
        Update: {
          companhia?: string
          criado_em?: string
          data_volta?: string | null
          data_voo?: string
          destino?: string
          id?: string
          origem?: string
          resultado?: Json
        }
        Relationships: []
      }
      consultas_log: {
        Row: {
          companhias: string[]
          consultado_em: string
          data_voo: string
          destino: string
          do_cache: boolean
          id: number
          origem: string
          user_id: string
        }
        Insert: {
          companhias?: string[]
          consultado_em?: string
          data_voo: string
          destino: string
          do_cache?: boolean
          id?: never
          origem: string
          user_id: string
        }
        Update: {
          companhias?: string[]
          consultado_em?: string
          data_voo?: string
          destino?: string
          do_cache?: boolean
          id?: never
          origem?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          id: string
          mensagem: string | null
          oferta: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem?: string | null
          oferta: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string | null
          oferta?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_respostas_api: {
        Row: {
          cenario: string | null
          companhia: string
          criado_em: string
          data_volta: string | null
          data_voo: string
          destino: string
          id: string
          origem: string
          response_json: Json
        }
        Insert: {
          cenario?: string | null
          companhia: string
          criado_em?: string
          data_volta?: string | null
          data_voo: string
          destino: string
          id?: string
          origem: string
          response_json: Json
        }
        Update: {
          cenario?: string | null
          companhia?: string
          criado_em?: string
          data_volta?: string | null
          data_voo?: string
          destino?: string
          id?: string
          origem?: string
          response_json?: Json
        }
        Relationships: []
      }
      ofertas: {
        Row: {
          aeroporto_destino: string | null
          aeroporto_origem: string | null
          busca_id: string
          cabine: string | null
          chegada: string | null
          companhia: string
          conexoes: number
          conexoes_detalhe: Json
          criado_em: string
          data_voo: string
          destino: string
          duracao: string | null
          id: string
          milhas: number | null
          numero_voo: string | null
          origem: string
          partida: string | null
          programa: string | null
          sentido: string
          taxas_rs: number | null
          tipo_milhas: string | null
          valor_dinheiro_rs: number | null
        }
        Insert: {
          aeroporto_destino?: string | null
          aeroporto_origem?: string | null
          busca_id: string
          cabine?: string | null
          chegada?: string | null
          companhia: string
          conexoes?: number
          conexoes_detalhe?: Json
          criado_em?: string
          data_voo: string
          destino: string
          duracao?: string | null
          id?: string
          milhas?: number | null
          numero_voo?: string | null
          origem: string
          partida?: string | null
          programa?: string | null
          sentido?: string
          taxas_rs?: number | null
          tipo_milhas?: string | null
          valor_dinheiro_rs?: number | null
        }
        Update: {
          aeroporto_destino?: string | null
          aeroporto_origem?: string | null
          busca_id?: string
          cabine?: string | null
          chegada?: string | null
          companhia?: string
          conexoes?: number
          conexoes_detalhe?: Json
          criado_em?: string
          data_voo?: string
          destino?: string
          duracao?: string | null
          id?: string
          milhas?: number | null
          numero_voo?: string | null
          origem?: string
          partida?: string | null
          programa?: string | null
          sentido?: string
          taxas_rs?: number | null
          tipo_milhas?: string | null
          valor_dinheiro_rs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_busca_id_fkey"
            columns: ["busca_id"]
            isOneToOne: false
            referencedRelation: "buscas_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          custo_milheiro: number | null
          id: string
          nome: string | null
          papel: string
          plano: string | null
          status_assinatura: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_milheiro?: number | null
          id: string
          nome?: string | null
          papel?: string
          plano?: string | null
          status_assinatura?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_milheiro?: number | null
          id?: string
          nome?: string | null
          papel?: string
          plano?: string | null
          status_assinatura?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rotas_salvas: {
        Row: {
          ativo: boolean
          companhias: string[]
          created_at: string
          data_fim: string
          data_inicio: string
          destino: string
          id: string
          origem: string
          preco_alvo_milhas: number | null
          preco_alvo_rs: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          companhias?: string[]
          created_at?: string
          data_fim: string
          data_inicio: string
          destino: string
          id?: string
          origem: string
          preco_alvo_milhas?: number | null
          preco_alvo_rs?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          ativo?: boolean
          companhias?: string[]
          created_at?: string
          data_fim?: string
          data_inicio?: string
          destino?: string
          id?: string
          origem?: string
          preco_alvo_milhas?: number | null
          preco_alvo_rs?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotas_salvas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          created_at: string
          data_inicio: string | null
          id: string
          plano: string
          proxima_cobranca: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          data_inicio?: string | null
          id?: string
          plano: string
          proxima_cobranca?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          data_inicio?: string | null
          id?: string
          plano?: string
          proxima_cobranca?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ofertas_comparadas: {
        Row: {
          aeroporto_destino: string | null
          aeroporto_origem: string | null
          busca_id: string | null
          cabine: string | null
          chegada: string | null
          companhia: string | null
          conexoes: number | null
          conexoes_detalhe: Json | null
          criado_em: string | null
          custo_milhas_rs: number | null
          custo_milheiro: number | null
          data_voo: string | null
          destino: string | null
          duracao: string | null
          economia_percentual: number | null
          id: string | null
          milhas: number | null
          numero_voo: string | null
          origem: string | null
          partida: string | null
          programa: string | null
          sentido: string | null
          taxas_rs: number | null
          tipo_milhas: string | null
          valor_dinheiro_rs: number | null
          valor_milheiro_implicito: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_busca_id_fkey"
            columns: ["busca_id"]
            isOneToOne: false
            referencedRelation: "buscas_cache"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      busca_em_cache: {
        Args: {
          p_companhia: string
          p_data_volta: string
          p_data_voo: string
          p_destino: string
          p_origem: string
        }
        Returns: string
      }
      processar_busca: { Args: { p_busca_id: string }; Returns: number }
      registrar_busca: {
        Args: {
          p_companhia: string
          p_data_volta: string
          p_data_voo: string
          p_destino: string
          p_origem: string
          p_resultado: Json
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
