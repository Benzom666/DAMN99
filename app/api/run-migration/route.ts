import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { migration } = await request.json()

    if (!migration || migration !== "012_add_order_number") {
      return NextResponse.json({ error: "Invalid migration" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    console.log("[v0] [MIGRATION] Running migration: 012_add_order_number.sql")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Add order_number column
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;",
    })

    if (alterError) {
      console.error("[v0] [MIGRATION] Error adding column:", alterError)
      // Try alternative approach - direct SQL execution
      const { error: directError } = await supabase.from("orders").select("order_number").limit(1)
      if (directError && directError.code === "42703") {
        // Column doesn't exist, need to add it manually
        return NextResponse.json(
          {
            error: "Cannot add column automatically. Please run this SQL in Supabase SQL Editor:",
            sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT; CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);",
          },
          { status: 500 },
        )
      }
    }

    // Create index
    const { error: indexError } = await supabase.rpc("exec_sql", {
      sql: "CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);",
    })

    if (indexError) {
      console.warn("[v0] [MIGRATION] Warning creating index:", indexError)
    }

    console.log("[v0] [MIGRATION] ✅ Migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully. Please refresh the page.",
    })
  } catch (error) {
    console.error("[v0] [MIGRATION] Migration error:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        details: String(error),
        instructions:
          "Please run this SQL manually in Supabase SQL Editor: ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT; CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);",
      },
      { status: 500 },
    )
  }
}
