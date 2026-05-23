// Hand-written to match supabase/migrations/*.
// Regenerate from a live project later with:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SrcType = "upload" | "youtube" | "image";
export type VideoSource = "admin" | "qr" | "requested";
export type VideoStatus = "draft" | "pending" | "approved" | "rejected";
export type MessageSource = "admin" | "qr" | "requested";
export type MessageStatus = "pending" | "approved" | "rejected";
export type SubscriberStatus = "active" | "unsubscribed";
export type Recipient = "lena" | "miu" | "both";

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          src_type: SrcType;
          src: string;
          thumb: string | null;
          caption: string;
          source: VideoSource;
          status: VideoStatus;
          requester_email: string | null;
          invite_id: string | null;
          display_name: string | null;
          show_name: boolean;
          reviewer_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          likes_count: number;
          recipient: Recipient;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          src_type: SrcType;
          src: string;
          thumb?: string | null;
          caption: string;
          source: VideoSource;
          status?: VideoStatus;
          requester_email?: string | null;
          invite_id?: string | null;
          display_name?: string | null;
          show_name?: boolean;
          reviewer_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          likes_count?: number;
          recipient?: Recipient;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          src_type?: SrcType;
          src?: string;
          thumb?: string | null;
          caption?: string;
          source?: VideoSource;
          status?: VideoStatus;
          requester_email?: string | null;
          invite_id?: string | null;
          display_name?: string | null;
          show_name?: boolean;
          reviewer_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          likes_count?: number;
          recipient?: Recipient;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          text: string;
          source: MessageSource;
          status: MessageStatus;
          requester_email: string | null;
          invite_id: string | null;
          display_name: string | null;
          show_name: boolean;
          reviewer_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          recipient: Recipient;
          image_url: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          text: string;
          source: MessageSource;
          status?: MessageStatus;
          requester_email?: string | null;
          invite_id?: string | null;
          display_name?: string | null;
          show_name?: boolean;
          reviewer_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          recipient?: Recipient;
          image_url?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      qr_invites: {
        Row: {
          id: string;
          token: string;
          label: string | null;
          used_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token?: string;
          label?: string | null;
          used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["qr_invites"]["Insert"]>;
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          video_id: string;
          invite_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          invite_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["likes"]["Insert"]>;
        Relationships: [];
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          unsubscribe_token: string;
          status: SubscriberStatus;
          subscribed_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          unsubscribe_token?: string;
          status?: SubscriberStatus;
          subscribed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscribers"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
