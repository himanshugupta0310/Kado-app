require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
(async () => {
  const { data, error } = await supabase
    .from("history_sessions")
    .update({
      status: "pending",
      conversation_id: null,
      transcript: null,
      collected_data: null,
      completed_at: null,
    })
    .eq("id", "e7a1b68a-9446-46b1-ab2b-dbc5a38eecb7")
    .select()
    .single();
  console.log(data, error);
  process.exit(0);
})();
