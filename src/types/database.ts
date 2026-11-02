
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "assessments": {
                  Row: {
                    "answers": (number)[],"id": string,"kind": string,"program_id": string | null,"score": number,"taken_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers": (number)[],"id": string,"kind": string,"program_id"?: string | null,"score": number,"taken_at": string,"user_id"?: string
                  }
                  Update: {
                    "answers"?: (number)[],"id"?: string,"kind"?: string,"program_id"?: string | null,"score"?: number,"taken_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audio_sessions": {
                  Row: {
                    "id": string,"played_at": string,"seconds": number,"sound": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"played_at": string,"seconds": number,"sound": string,"user_id"?: string
                  }
                  Update: {
                    "id"?: string,"played_at"?: string,"seconds"?: number,"sound"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"handbook_cards": {
                  Row: {
                    "body": string,"callout": string,"pos": number,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"callout": string,"pos": number,"title": string
                  }
                  Update: {
                    "body"?: string,"callout"?: string,"pos"?: number,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"handbook_situations": {
                  Row: {
                    "pos": number,"reaction": string,"solution": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "pos": number,"reaction": string,"solution": string,"title": string
                  }
                  Update: {
                    "pos"?: number,"reaction"?: string,"solution"?: string,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"messages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"sender_id": string,"student_id": string,"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"sender_id": string,"student_id": string,"teacher_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"sender_id"?: string,"student_id"?: string,"teacher_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"posts": {
                  Row: {
                    "body": string,"id": string,"posted_on": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"id": string,"posted_on": string,"user_id"?: string
                  }
                  Update: {
                    "body"?: string,"id"?: string,"posted_on"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "approved": boolean,"class_name": string | null,"created_at": string,"full_name": string,"id": string,"role": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved"?: boolean,"class_name"?: string | null,"created_at"?: string,"full_name"?: string,"id": string,"role"?: string,"username": string
                  }
                  Update: {
                    "approved"?: boolean,"class_name"?: string | null,"created_at"?: string,"full_name"?: string,"id"?: string,"role"?: string,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"programs": {
                  Row: {
                    "checks": NonNullable<Json>,"days": number,"id": string,"post_id": string | null,"pre_id": string | null,"start_date": string,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checks"?: NonNullable<Json>,"days": number,"id": string,"post_id"?: string | null,"pre_id"?: string | null,"start_date": string,"status": string,"user_id"?: string
                  }
                  Update: {
                    "checks"?: NonNullable<Json>,"days"?: number,"id"?: string,"post_id"?: string | null,"pre_id"?: string | null,"start_date"?: string,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quiz_questions": {
                  Row: {
                    "labels": (string)[],"num": number,"points": (number)[],"question": string
                  }
                  ComputedFields: never
                  Insert: {
                    "labels": (string)[],"num": number,"points": (number)[],"question": string
                  }
                  Update: {
                    "labels"?: (string)[],"num"?: number,"points"?: (number)[],"question"?: string
                  }
                  Relationships: [
                    
                  ]
                },"teacher_classes": {
                  Row: {
                    "class_name": string,"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_name": string,"teacher_id"?: string
                  }
                  Update: {
                    "class_name"?: string,"teacher_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_delete_post":
{ Args: { "post_id": string }; Returns: undefined
                           },
"admin_delete_user":
{ Args: { "target": string }; Returns: undefined
                           },
"admin_reset_password":
{ Args: { "new_password": string,"target": string }; Returns: undefined
                           },
"admin_rotate_admin_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"admin_rotate_teacher_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"admin_save_handbook":
{ Args: { "cards": Json,"situations": Json }; Returns: undefined
                           },
"admin_save_quiz":
{ Args: { "items": Json }; Returns: undefined
                           },
"admin_set_role":
{ Args: { "new_role": string,"target": string }; Returns: undefined
                           },
"can_view_student":
{ Args: { "target": string }; Returns: boolean
                           },
"claim_admin":
{ Args: { "code": string }; Returns: boolean
                           },
"claim_teacher":
{ Args: { "code": string }; Returns: boolean
                           },
"community_posts":
{ Args: Record<PropertyKey, never>; Returns: {
              "body": string,"id": string,"posted_on": string
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_teacher":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"my_teachers":
{ Args: Record<PropertyKey, never>; Returns: {
              "full_name": string,"id": string,"username": string
            }[]
                           },
"set_student_approval":
{ Args: { "ok": boolean,"target": string }; Returns: undefined
                           },
"teacher_reset_password":
{ Args: { "new_password": string,"target": string }; Returns: undefined
                           },
"teaches":
{ Args: { "student": string,"teacher": string }; Returns: boolean
                           },
"viewable_students":
{ Args: Record<PropertyKey, never>; Returns: string[]
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
