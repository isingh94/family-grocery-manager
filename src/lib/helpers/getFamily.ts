import { supabase } from "@/lib/supabase/client";

export async function getCurrentFamilyId() {
	  const {
		      data: { user },
		        } = await supabase.auth.getUser();

			  if (!user) {
				      return null;
				        }

					  const { data } = await supabase
					      .from("families")
					          .select("id")
						      .eq("owner_id", user.id)
						          .order("created_at", { ascending: false })
							      .limit(1)
							          .single();

								    return data?.id ?? null;
}
