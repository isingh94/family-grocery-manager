"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

export default function FamilyPage() {
	  const [familyName, setFamilyName] = useState("");
	    const [message, setMessage] = useState("");

async function createFamily() {
	  const {
		      data: { user },
		        } = await supabase.auth.getUser();

			  if (!user) {
				      setMessage("Not logged in");
				          return;
					    }

					      const { error } = await supabase
					          .from("families")
						      .insert({
							            name: familyName,
								          owner_id: user.id,
									      });

									        if (error) {
											    setMessage(error.message);
											        return;
												  }

												    setMessage("Family created successfully");
}

																		  return (
																			      <main className="p-8">
																			            <h1 className="text-3xl font-bold">
																				            Create Family
																					          </h1>
																						  <>
																						    <Navbar />
																						      <main>...</main>
																						      </>

																						        <input

																							        className="mt-4 border p-2"
																								        placeholder="Family Name"
																									        value={familyName}
																										        onChange={(e) => setFamilyName(e.target.value)}
																											      />

																											            <button
																												            onClick={createFamily}
																													            className="ml-4 rounded bg-black px-4 py-2 text-white"
																														          >
																															          Create
																																        </button>

																																	      <p className="mt-4">{message}</p>
																																	          </main>
																																		    );
}
