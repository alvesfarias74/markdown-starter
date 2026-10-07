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
      jobs: {
        Row: {
          amount: number
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          payout_status: string
          platform_fee: number
          professional_id: string
          professional_net: number
          quote_id: string | null
          request_id: string | null
          scheduled_for: string | null
          status: string
          title: string
        }
        Insert: {
          amount?: number
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          payout_status?: string
          platform_fee?: number
          professional_id: string
          professional_net?: number
          quote_id?: string | null
          request_id?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
        }
        Update: {
          amount?: number
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          payout_status?: string
          platform_fee?: number
          professional_id?: string
          professional_net?: number
          quote_id?: string | null
          request_id?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          after_photo: string | null
          before_photo: string | null
          category_slug: string | null
          created_at: string
          description: string | null
          id: string
          photos: string[]
          position: number
          professional_id: string
          title: string
        }
        Insert: {
          after_photo?: string | null
          before_photo?: string | null
          category_slug?: string | null
          created_at?: string
          description?: string | null
          id?: string
          photos?: string[]
          position?: number
          professional_id: string
          title: string
        }
        Update: {
          after_photo?: string | null
          before_photo?: string | null
          category_slug?: string | null
          created_at?: string
          description?: string | null
          id?: string
          photos?: string[]
          position?: number
          professional_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          avatar_url: string | null
          bio: string | null
          category_slugs: string[]
          city: string | null
          created_at: string
          display_name: string
          experience_range: string | null
          experience_text: string | null
          headline: string | null
          id: string
          is_available: boolean
          is_verified: boolean
          max_distance_km: number | null
          neighborhoods: string[]
          price_from: number | null
          price_unit: string | null
          published_at: string | null
          rating_avg: number | null
          rating_count: number
          schedule: Json
          services_count: number
          slug: string
          specialties: string[]
          state: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          category_slugs?: string[]
          city?: string | null
          created_at?: string
          display_name: string
          experience_range?: string | null
          experience_text?: string | null
          headline?: string | null
          id?: string
          is_available?: boolean
          is_verified?: boolean
          max_distance_km?: number | null
          neighborhoods?: string[]
          price_from?: number | null
          price_unit?: string | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          schedule?: Json
          services_count?: number
          slug: string
          specialties?: string[]
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          category_slugs?: string[]
          city?: string | null
          created_at?: string
          display_name?: string
          experience_range?: string | null
          experience_text?: string | null
          headline?: string | null
          id?: string
          is_available?: boolean
          is_verified?: boolean
          max_distance_km?: number | null
          neighborhoods?: string[]
          price_from?: number | null
          price_unit?: string | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          schedule?: Json
          services_count?: number
          slug?: string
          specialties?: string[]
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          message: string
          professional_id: string
          request_id: string
          status: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          message?: string
          professional_id: string
          request_id: string
          status?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          message?: string
          professional_id?: string
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          client_name: string
          comment: string | null
          created_at: string
          id: string
          job_id: string | null
          professional_id: string
          rating: number
          response: string | null
          response_at: string | null
        }
        Insert: {
          client_id: string
          client_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          professional_id: string
          rating: number
          response?: string | null
          response_at?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          professional_id?: string
          rating?: number
          response?: string | null
          response_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          category_slug: string | null
          city: string | null
          client_id: string
          created_at: string
          description: string
          desired_date: string | null
          id: string
          neighborhood: string | null
          service_name: string
          state: string | null
          status: string
          target_professional_id: string | null
          urgency: string
        }
        Insert: {
          category_slug?: string | null
          city?: string | null
          client_id: string
          created_at?: string
          description?: string
          desired_date?: string | null
          id?: string
          neighborhood?: string | null
          service_name: string
          state?: string | null
          status?: string
          target_professional_id?: string | null
          urgency?: string
        }
        Update: {
          category_slug?: string | null
          city?: string | null
          client_id?: string
          created_at?: string
          description?: string
          desired_date?: string | null
          id?: string
          neighborhood?: string | null
          service_name?: string
          state?: string | null
          status?: string
          target_professional_id?: string | null
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_target_professional_id_fkey"
            columns: ["target_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          document_path: string
          id: string
          notes: string | null
          professional_id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          selfie_path: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          document_path: string
          id?: string
          notes?: string | null
          professional_id: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          selfie_path?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          document_path?: string
          id?: string
          notes?: string | null
          professional_id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          selfie_path?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_professional_stats: { Args: { _pro: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "professional" | "client"
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
    Enums: {
      app_role: ["admin", "moderator", "professional", "client"],
    },
  },
} as const
