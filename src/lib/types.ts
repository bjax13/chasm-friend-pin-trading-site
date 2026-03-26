// ─── Pin names ────────────────────────────────────────────────────────────────

export type PinName = 'Howlerina' | 'Shredhead' | 'Burpslurper' | 'Cleverclaws' | 'Darren'

// ─── Database schema (used to type the Supabase client) ───────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          discord_handle: string | null
          social_handle: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          discord_handle?: string | null
          social_handle?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          discord_handle?: string | null
          social_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pin_inventory: {
        Row: {
          id: string
          user_id: string
          pin_name: PinName
          has_it: boolean
          wants_it: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pin_name: PinName
          has_it?: boolean
          wants_it?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          has_it?: boolean
          wants_it?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      connect_requests: {
        Row: {
          id: string
          requester_id: string
          recipient_id: string
          status: ConnectRequestStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          recipient_id: string
          status?: ConnectRequestStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: ConnectRequestStatus
          updated_at?: string
        }
        Relationships: []
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
  }
}

// ─── App-level types ──────────────────────────────────────────────────────────

export type ConnectRequestStatus = 'pending' | 'connected' | 'cancelled' | 'declined'

/** A user's profile row from the `profiles` table. */
export type Profile = Database['public']['Tables']['profiles']['Row']

/** A row from `pin_inventory` for a specific user + pin. */
export type PinInventory = Database['public']['Tables']['pin_inventory']['Row']

/** A row from `connect_requests`. */
export type ConnectRequest = Database['public']['Tables']['connect_requests']['Row']

/**
 * A mutual trading match — another user who has at least one pin I want AND
 * wants at least one pin I have. The `connect_request` field is present if a
 * request already exists between us (in any direction).
 */
export type Match = {
  user_id: string
  /** Pins this user has that I want. */
  they_have_i_want: PinName[]
  /** Pins I have that this user wants. */
  i_have_they_want: PinName[]
  /** Existing connect request between us (either direction), if any. */
  connect_request: ConnectRequest | null
}

/**
 * A connected user whose contact details are revealed to the current user
 * because both sides have accepted the connect request.
 */
export type ConnectedContact = {
  connect_request_id: string
  user_id: string
  email: string
  discord_handle: string | null
  social_handle: string | null
}
