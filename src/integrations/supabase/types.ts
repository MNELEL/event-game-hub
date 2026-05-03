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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      background_music: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          storage_path: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          storage_path: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          storage_path?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      branding: {
        Row: {
          about_description: string
          created_at: string
          full_name: string
          hero_subtitle: string
          icon_festive: string
          icon_primary: string
          id: string
          is_active: boolean
          lobby_subtitle: string
          name: string
          phone: string
          short_name: string
          tagline: string
          updated_at: string
        }
        Insert: {
          about_description?: string
          created_at?: string
          full_name?: string
          hero_subtitle?: string
          icon_festive?: string
          icon_primary?: string
          id?: string
          is_active?: boolean
          lobby_subtitle?: string
          name?: string
          phone?: string
          short_name?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          about_description?: string
          created_at?: string
          full_name?: string
          hero_subtitle?: string
          icon_festive?: string
          icon_primary?: string
          id?: string
          is_active?: boolean
          lobby_subtitle?: string
          name?: string
          phone?: string
          short_name?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          created_at: string
          default_time_limit: number
          id: string
          owner_id: string | null
          questions_per_game: number
          selected_categories: string[]
          show_leaderboard_after_each: boolean
          shuffle_questions: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_time_limit?: number
          id?: string
          owner_id?: string | null
          questions_per_game?: number
          selected_categories?: string[]
          show_leaderboard_after_each?: boolean
          shuffle_questions?: boolean
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_time_limit?: number
          id?: string
          owner_id?: string | null
          questions_per_game?: number
          selected_categories?: string[]
          show_leaderboard_after_each?: boolean
          shuffle_questions?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_question_index: number
          id: string
          question_ids: string[]
          settings: Json
          status: string
          time_remaining: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_question_index?: number
          id?: string
          question_ids?: string[]
          settings?: Json
          status?: string
          time_remaining?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_question_index?: number
          id?: string
          question_ids?: string[]
          settings?: Json
          status?: string
          time_remaining?: number
          updated_at?: string
        }
        Relationships: []
      }
      player_answers: {
        Row: {
          answer: number
          correct: boolean
          created_at: string
          game_id: string
          id: string
          player_id: string
          points_earned: number
          question_id: string
          time_taken: number
        }
        Insert: {
          answer: number
          correct?: boolean
          created_at?: string
          game_id: string
          id?: string
          player_id: string
          points_earned?: number
          question_id: string
          time_taken?: number
        }
        Update: {
          answer?: number
          correct?: boolean
          created_at?: string
          game_id?: string
          id?: string
          player_id?: string
          points_earned?: number
          question_id?: string
          time_taken?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_answers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          connected: boolean
          created_at: string
          game_id: string
          id: string
          name: string
          score: number
          secret_token: string
        }
        Insert: {
          connected?: boolean
          created_at?: string
          game_id: string
          id?: string
          name: string
          score?: number
          secret_token?: string
        }
        Update: {
          connected?: boolean
          created_at?: string
          game_id?: string
          id?: string
          name?: string
          score?: number
          secret_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string
          correct_answer: number
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          options: Json
          order_index: number
          owner_id: string | null
          points: number
          text: string
          time_limit: number
          updated_at: string
        }
        Insert: {
          category?: string
          correct_answer?: number
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          options?: Json
          order_index?: number
          owner_id?: string | null
          points?: number
          text: string
          time_limit?: number
          updated_at?: string
        }
        Update: {
          category?: string
          correct_answer?: number
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          options?: Json
          order_index?: number
          owner_id?: string | null
          points?: number
          text?: string
          time_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      players_public: {
        Row: {
          connected: boolean | null
          created_at: string | null
          game_id: string | null
          id: string | null
          name: string | null
          score: number | null
        }
        Insert: {
          connected?: boolean | null
          created_at?: string | null
          game_id?: string | null
          id?: string | null
          name?: string | null
          score?: number | null
        }
        Update: {
          connected?: boolean | null
          created_at?: string | null
          game_id?: string | null
          id?: string | null
          name?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      increment_player_score: {
        Args: { p_player_id: string; p_points: number }
        Returns: undefined
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
