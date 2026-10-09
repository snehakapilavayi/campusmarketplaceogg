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
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          after: Json | null
          before: Json | null
          college_id: string | null
          created_at: string
          id: string
          reason: string | null
          target: string | null
        }
        Insert: {
          action: string
          admin_id: string
          after?: Json | null
          before?: Json | null
          college_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          target?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          after?: Json | null
          before?: Json | null
          college_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      campuses: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      cart: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      colleges: {
        Row: {
          active: boolean
          city: string | null
          created_at: string
          domain_suffix: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          city?: string | null
          created_at?: string
          domain_suffix?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          city?: string | null
          created_at?: string
          domain_suffix?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string | null
          reported: boolean
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          reported?: boolean
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          reported?: boolean
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      event_banners: {
        Row: {
          accent: string | null
          active: boolean
          campus: string | null
          college_id: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          accent?: string | null
          active?: boolean
          campus?: string | null
          college_id?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          accent?: string | null
          active?: boolean
          campus?: string | null
          college_id?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          starts_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_banners_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          flagged: boolean
          id: string
          listing_id: string
          moderation_note: string | null
          sort_order: number
          url: string
        }
        Insert: {
          flagged?: boolean
          id?: string
          listing_id: string
          moderation_note?: string | null
          sort_order?: number
          url: string
        }
        Update: {
          flagged?: boolean
          id?: string
          listing_id?: string
          moderation_note?: string | null
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          available_from: string | null
          available_until: string | null
          badge: string | null
          buyer_id: string | null
          category_id: string | null
          college_id: string | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string
          deposit: number | null
          description: string | null
          featured: boolean
          id: string
          price: number
          rating_reminded_at: string | null
          rejection_reason: string | null
          removal_reason: string | null
          rent_period: Database["public"]["Enums"]["rent_period"] | null
          resubmit_by: string | null
          seller_id: string
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          badge?: string | null
          buyer_id?: string | null
          category_id?: string | null
          college_id?: string | null
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          deposit?: number | null
          description?: string | null
          featured?: boolean
          id?: string
          price?: number
          rating_reminded_at?: string | null
          rejection_reason?: string | null
          removal_reason?: string | null
          rent_period?: Database["public"]["Enums"]["rent_period"] | null
          resubmit_by?: string | null
          seller_id: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          badge?: string | null
          buyer_id?: string | null
          category_id?: string | null
          college_id?: string | null
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          deposit?: number | null
          description?: string | null
          featured?: boolean
          id?: string
          price?: number
          rating_reminded_at?: string | null
          rejection_reason?: string | null
          removal_reason?: string | null
          rent_period?: Database["public"]["Enums"]["rent_period"] | null
          resubmit_by?: string | null
          seller_id?: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          message: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          bio: string | null
          campus: string | null
          college_id: string | null
          created_at: string
          email_prefs: Json
          full_name: string
          id: string
          profile_complete: boolean
          suspended: boolean
          swapcoin_rating: number
          transactions_count: number
          trusted_seller: boolean
          updated_at: string
          verification: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          campus?: string | null
          college_id?: string | null
          created_at?: string
          email_prefs?: Json
          full_name?: string
          id: string
          profile_complete?: boolean
          suspended?: boolean
          swapcoin_rating?: number
          transactions_count?: number
          trusted_seller?: boolean
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          campus?: string | null
          college_id?: string | null
          created_at?: string
          email_prefs?: Json
          full_name?: string
          id?: string
          profile_complete?: boolean
          suspended?: boolean
          swapcoin_rating?: number
          transactions_count?: number
          trusted_seller?: boolean
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          accuracy: number
          communication: number
          created_at: string
          experience: number
          hidden: boolean
          hidden_by: string | null
          hidden_reason: string | null
          id: string
          listing_id: string | null
          review: string | null
          reviewed_id: string
          reviewer_id: string
          swapcoins: number
        }
        Insert: {
          accuracy?: number
          communication?: number
          created_at?: string
          experience?: number
          hidden?: boolean
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          listing_id?: string | null
          review?: string | null
          reviewed_id: string
          reviewer_id: string
          swapcoins?: number
        }
        Update: {
          accuracy?: number
          communication?: number
          created_at?: string
          experience?: number
          hidden?: boolean
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          listing_id?: string | null
          review?: string | null
          reviewed_id?: string
          reviewer_id?: string
          swapcoins?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_to: string | null
          college_id: string | null
          created_at: string
          description: string | null
          escalated_at: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string | null
          target_type: string
        }
        Insert: {
          assigned_to?: string | null
          college_id?: string | null
          created_at?: string
          description?: string | null
          escalated_at?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string | null
          target_type: string
        }
        Update: {
          assigned_to?: string | null
          college_id?: string | null
          created_at?: string
          description?: string | null
          escalated_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          college_id: string | null
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          college_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_admin_role: {
        Args: never
        Returns: {
          college_id: string
          role: string
        }[]
      }
      get_public_profile_cards: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_public_seller_card: {
        Args: { _id: string }
        Returns: {
          avatar_url: string
          campus: string
          full_name: string
          id: string
          swapcoin_rating: number
          verification: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      get_public_settings: {
        Args: never
        Returns: {
          key: string
          value: Json
        }[]
      }
      get_public_stats: {
        Args: never
        Returns: {
          listing_count: number
          student_count: number
        }[]
      }
      get_seller_rating_stats: {
        Args: { _seller: string }
        Returns: {
          avg_swapcoins: number
          review_count: number
        }[]
      }
      get_swapcoin_summary: {
        Args: { _id: string }
        Returns: {
          accuracy: number
          avg_swapcoins: number
          communication: number
          completed_sales: number
          completed_swaps: number
          experience: number
          recent: Json
          review_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_college_admin_of: { Args: { _college: string }; Returns: boolean }
      send_rating_reminders: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "student"
        | "admin"
        | "moderator"
        | "college_admin"
        | "super_admin"
      item_condition: "brand_new" | "like_new" | "good" | "fair" | "used"
      listing_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "archived"
      listing_type: "sell" | "rent"
      rent_period: "day" | "week" | "month"
      report_status:
        | "pending"
        | "under_review"
        | "resolved"
        | "rejected"
        | "escalated"
      verification_status: "pending" | "verified" | "rejected"
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
      app_role: [
        "student",
        "admin",
        "moderator",
        "college_admin",
        "super_admin",
      ],
      item_condition: ["brand_new", "like_new", "good", "fair", "used"],
      listing_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "completed",
        "archived",
      ],
      listing_type: ["sell", "rent"],
      rent_period: ["day", "week", "month"],
      report_status: [
        "pending",
        "under_review",
        "resolved",
        "rejected",
        "escalated",
      ],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
