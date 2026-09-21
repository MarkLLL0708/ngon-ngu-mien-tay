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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companion_memories: {
        Row: {
          category: string
          companion_id: string
          created_at: string
          fact: string
          id: string
          pinned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          companion_id: string
          created_at?: string
          fact: string
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          companion_id?: string
          created_at?: string
          fact?: string
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_memories_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_messages: {
        Row: {
          companion_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          companion_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          companion_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_messages_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
        ]
      }
      companions: {
        Row: {
          address_other: string
          address_self: string
          age_vibe: string
          chat_language: string
          city: string
          created_at: string
          id: string
          job: string
          last_message_at: string | null
          last_message_preview: string
          memory_summary: string
          mode: string
          name: string
          persona_gender: string
          persona_style: string
          personality: string
          region: string
          user_id: string
          voice_profile_id: string | null
          welcome_enabled: boolean
        }
        Insert: {
          address_other?: string
          address_self?: string
          age_vibe: string
          chat_language?: string
          city?: string
          created_at?: string
          id?: string
          job?: string
          last_message_at?: string | null
          last_message_preview?: string
          memory_summary?: string
          mode: string
          name: string
          persona_gender?: string
          persona_style?: string
          personality: string
          region: string
          user_id: string
          voice_profile_id?: string | null
          welcome_enabled?: boolean
        }
        Update: {
          address_other?: string
          address_self?: string
          age_vibe?: string
          chat_language?: string
          city?: string
          created_at?: string
          id?: string
          job?: string
          last_message_at?: string | null
          last_message_preview?: string
          memory_summary?: string
          mode?: string
          name?: string
          persona_gender?: string
          persona_style?: string
          personality?: string
          region?: string
          user_id?: string
          voice_profile_id?: string | null
          welcome_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "companions_voice_profile_id_fkey"
            columns: ["voice_profile_id"]
            isOneToOne: false
            referencedRelation: "voice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_confirmed: boolean
          age_group: string | null
          created_at: string
          default_city: string | null
          default_region: string | null
          gender: string
          id: string
          reply_language: string
          subscription_status: string
          ui_language: string
          updated_at: string
        }
        Insert: {
          age_confirmed?: boolean
          age_group?: string | null
          created_at?: string
          default_city?: string | null
          default_region?: string | null
          gender?: string
          id: string
          reply_language?: string
          subscription_status?: string
          ui_language?: string
          updated_at?: string
        }
        Update: {
          age_confirmed?: boolean
          age_group?: string | null
          created_at?: string
          default_city?: string | null
          default_region?: string | null
          gender?: string
          id?: string
          reply_language?: string
          subscription_status?: string
          ui_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      reply_generations: {
        Row: {
          age_group: string
          city: string
          created_at: string
          id: string
          input_text: string
          mode: string
          region: string
          result: Json
          user_id: string
        }
        Insert: {
          age_group: string
          city: string
          created_at?: string
          id?: string
          input_text: string
          mode: string
          region: string
          result: Json
          user_id: string
        }
        Update: {
          age_group?: string
          city?: string
          created_at?: string
          id?: string
          input_text?: string
          mode?: string
          region?: string
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      voice_profiles: {
        Row: {
          active: boolean
          age_vibe: string
          created_at: string
          id: string
          label: string
          persona_gender: string
          provider: string
          region: string
          speed: number
          style_prompt: string
          voice_id: string
        }
        Insert: {
          active?: boolean
          age_vibe?: string
          created_at?: string
          id?: string
          label?: string
          persona_gender?: string
          provider: string
          region?: string
          speed?: number
          style_prompt?: string
          voice_id?: string
        }
        Update: {
          active?: boolean
          age_vibe?: string
          created_at?: string
          id?: string
          label?: string
          persona_gender?: string
          provider?: string
          region?: string
          speed?: number
          style_prompt?: string
          voice_id?: string
        }
        Relationships: []
      }
      voice_ratings: {
        Row: {
          accent: number
          created_at: string
          id: string
          keep_listening: number
          natural: number
          profile_id: string
          user_id: string
        }
        Insert: {
          accent: number
          created_at?: string
          id?: string
          keep_listening: number
          natural: number
          profile_id: string
          user_id: string
        }
        Update: {
          accent?: number
          created_at?: string
          id?: string
          keep_listening?: number
          natural?: number
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_ratings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "voice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
